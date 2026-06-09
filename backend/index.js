import 'dotenv/config'; 
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "agrovault_super_secret_key"; // Token lock karne ki chaabi

// ─── PRISMA 7 DRIVER SETUP ───
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

// ==========================================
// 🛡️ THE BOUNCER (AUTH MIDDLEWARE) UPGRADED
// ==========================================
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "No Token Found" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    req.userId = decoded.id;       // Khud ki ID (Employee ya Owner)
    req.userName = decoded.name;   // Khud ka naam
    req.userRole = decoded.role;   // "OWNER" ya "EMPLOYEE"
    
    // ─── MASTER BUCKET LOGIC ───
    // Agar login user Owner hai toh uski apni ID, agar Employee hai toh uske Owner ki ID
    req.shopOwnerId = decoded.role === "OWNER" ? decoded.id : decoded.ownerId;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or Expired Token" });
  }
};

// Apne Vercel wale link ko allow karein (Aakhiri mein slash '/' mat lagana)
app.use(cors({
    origin: ['http://localhost:3000', 'https://agro-vault-theta.vercel.app'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));


// ==========================================
// 0. AUTHENTICATION (REGISTER & LOGIN) APIs
// ==========================================

// ─── NAYI DUKAAN YA STAFF REGISTER KARNA (SIGN UP) ───
app.post('/api/register', async (req, res) => {
  try {
    // UI se role aur shopKey bhi aayegi ab
    const { name, phone, password, shopName, shopType, role, shopKey } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Yeh mobile number pehle se register hai!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUserData = { name, phone, password: hashedPassword, role: role || "OWNER" };

    // AGAR USER "OWNER" HAI:
    if (newUserData.role === "OWNER") {
      newUserData.shopName = shopName;
      newUserData.shopType = shopType;
      // Ek unique 6-character ki chaabi banate hain
      newUserData.shopKey = 'AGRO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    } 
    
    // AGAR USER "EMPLOYEE" HAI:
    else if (newUserData.role === "EMPLOYEE") {
      if (!shopKey) {
        return res.status(400).json({ success: false, message: "Employee register karne ke liye Shop Key zaroori hai!" });
      }
      
      // Malik ko uski chaabi se dhoondho
      const malik = await prisma.user.findUnique({ where: { shopKey: shopKey } });
      if (!malik) {
        return res.status(404).json({ success: false, message: "Galat Shop Key! Malik ki dukan nahi mili." });
      }

      // Employee ke khate mein malik ki details daal do
      newUserData.ownerId = malik.id;
      newUserData.shopName = malik.shopName; // Taki employee ko app me shop ka naam dikhe
    }

    // User create kardo
    const newUser = await prisma.user.create({ data: newUserData });

    res.status(201).json({ 
      success: true, 
      message: newUserData.role === "OWNER" ? "Dukaan successfully ban gayi!" : "Staff account successfully ban gaya!",
      shopKey: newUser.shopKey // UI mein owner ko uski key dikhane ke kaam aayega
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Account banane mein gadbad hui" });
  }
});

// ─── DUKAAN MEIN LOGIN KARNA ───
app.post('/api/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Khata nahi mila. Kripya pehle register karein." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Galat password!" });
    }

    // Token mein role aur ownerId daal diya
    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name, 
        shopName: user.shopName, 
        shopType: user.shopType,
        role: user.role,           // NAYA ADD KIYA
        ownerId: user.ownerId      // NAYA ADD KIYA
      },
      SECRET_KEY,
      { expiresIn: '7d' } 
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: { 
        name: user.name, 
        shopName: user.shopName, 
        shopType: user.shopType,
        role: user.role,           // NAYA ADD KIYA
        shopKey: user.shopKey      // NAYA ADD KIYA (Taki Owner ko apni key dikh sake)
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Login mein error aaya" });
  }
});


// ==========================================
// 1. CUSTOMERS (KISAAN) APIs
// ==========================================

app.post('/api/customers', auth, async (req, res) => {
  try {
    const { name, mobile, village } = req.body;
    const newCustomer = await prisma.customer.create({ 
      // req.userId ki jagah req.shopOwnerId kar diya
      data: { name, mobile, village, userId: req.shopOwnerId } 
    });
    res.status(201).json({ success: true, message: "Kisaan ka khata khul gaya!", data: newCustomer });
  } catch (error) {
    res.status(500).json({ success: false, message: "System error" });
  }
});

app.get('/api/customers', auth, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ 
      // req.userId ki jagah req.shopOwnerId kar diya taaki sabko sabka dikhe
      where: { userId: req.shopOwnerId }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Kisaan fetch error" });
  }
});

app.get('/api/customers/:id', auth, async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.shopOwnerId }, // <-- FIX
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) return res.status(404).json({ success: false, message: "Kisaan nahi mila" });

    let totalPurchased = 0, totalPaid = 0;
    customer.orders.forEach(order => {
      totalPurchased += order.totalAmount;
      totalPaid += order.paidAmount;
    });

    res.status(200).json({ 
      success: true, 
      data: { ...customer, totalPurchased, totalPaid, totalDue: totalPurchased - totalPaid }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Profile load error" });
  }
});

app.post('/api/customers/:id/bulk-pay', auth, async (req, res) => {
  try {
    let { amount } = req.body;
    const originalAmount = Number(amount);
    amount = originalAmount;

    if (amount <= 0) return res.status(400).json({ success: false, message: "Amount sahi nahi hai" });

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({ where: { id: req.params.id, userId: req.shopOwnerId } }); // <-- FIX
    if(!customer) return res.status(403).json({ success: false, message: "Unauthorized" });

    const pendingOrders = await prisma.order.findMany({
      where: { customerId: req.params.id, status: { in: ['UDHAAR', 'PARTIAL'] } },
      orderBy: { createdAt: 'asc' } 
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({ data: { customerId: req.params.id, amount: originalAmount } });

      for (const order of pendingOrders) {
        if (amount <= 0) break;
        const dueOnThisOrder = order.totalAmount - order.paidAmount;
        if (amount >= dueOnThisOrder) {
          await tx.order.update({
            where: { id: order.id },
            data: { paidAmount: order.totalAmount, status: 'PAID' }
          });
          amount -= dueOnThisOrder; 
        } else {
          await tx.order.update({
            where: { id: order.id },
            data: { paidAmount: order.paidAmount + amount, status: 'PARTIAL' }
          });
          amount = 0; 
        }
      }
    });
    res.status(200).json({ success: true, message: "Paisa jama ho gaya!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Bulk payment error" });
  }
});

app.get('/api/customers/:id/payments', auth, async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({ where: { id: req.params.id, userId: req.shopOwnerId } }); // <-- FIX
    if(!customer) return res.status(403).json({ success: false, message: "Unauthorized" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalPayments = await prisma.payment.count({ where: { customerId: req.params.id } });
    const payments = await prisma.payment.findMany({
      where: { customerId: req.params.id },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ 
      success: true, 
      data: payments,
      pagination: { currentPage: page, totalPages: Math.ceil(totalPayments / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payments fetch error" });
  }
});


// ==========================================
// 2. INVENTORY (PRODUCTS) APIs (MASTER BUCKET LINKED)
// ==========================================

app.get('/api/products', auth, async (req, res) => {
  try {
    if (!req.query.page) {
      const products = await prisma.product.findMany({ 
        where: { userId: req.shopOwnerId }, // Sabko Malik ka (dukkan ka) stock dikhega
        orderBy: { createdAt: 'desc' } 
      });
      return res.status(200).json({ success: true, data: products });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const totalItems = await prisma.product.count({ where: { userId: req.shopOwnerId } });

    const products = await prisma.product.findMany({
      where: { userId: req.shopOwnerId }, // Dukaan ka common stock
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ 
      success: true, 
      data: products,
      pagination: { currentPage: page, totalPages: Math.ceil(totalItems / limit), totalItems }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Inventory fetch error" });
  }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, brand, category, buyPrice, sellPrice, stockQty, unit } = req.body;
    const newProduct = await prisma.product.create({
      data: { 
        name, brand: brand || "Local", category, buyPrice: Number(buyPrice), 
        sellPrice: Number(sellPrice), stockQty: Number(stockQty), unit,
        userId: req.shopOwnerId // Samaan hamesha dukkan ke khate me judega
      }
    });
    res.status(201).json({ success: true, message: "Samaan add ho gaya!", data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Product save error" });
  }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, userId: req.shopOwnerId } });
    if (!product) return res.status(404).json({ success: false, message: "Product nahi mila" });

    const { name, brand, category, buyPrice, sellPrice, stockQty, unit } = req.body;
    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, brand: brand || "Local", category, buyPrice: Number(buyPrice), sellPrice: Number(sellPrice), stockQty: Number(stockQty), unit }
    });
    res.status(200).json({ success: true, message: "Stock update ho gaya!", data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Product update error" });
  }
});


// ==========================================
// 3. ORDERS (BILLING & UDHAAR) APIs
// ==========================================

app.post('/api/orders', auth, async (req, res) => {
  try {
    const { customerId, items, paidAmount } = req.body;
    let totalAmount = items.reduce((acc, item) => acc + (item.qty * item.priceAtSale), 0);

    let status = "PAID";
    if (paidAmount === 0) status = "UDHAAR";
    else if (paidAmount < totalAmount) status = "PARTIAL";

    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.shopOwnerId,       // Malik ke bucket mein data gaya
          createdById: req.userId,       // Kisne becha (Employee ID)
          createdByName: req.userName,   // Kisne becha (Employee Name)
          customerId, totalAmount, paidAmount, status,
          items: { 
            create: items.map(item => ({ 
              productId: item.productId, 
              qty: Number(item.qty),              // Base quantity (e.g., 0.5)
              priceAtSale: Number(item.priceAtSale), // Price per base unit
              enteredQty: Number(item.enteredQty || item.qty), // Receipt display
              enteredUnit: item.enteredUnit || "Base"          // Receipt display
            })) 
          }
        },
        include: { items: true }
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.qty } }
        });
      }
      return newOrder;
    });

    res.status(201).json({ success: true, message: "Parchi ban gayi!", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Parchi katne mein error" });
  }
});

// ─── CANCEL BILL (VOID ORDER) API ───
app.put('/api/orders/:id/cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Pehle bill dhoondho (Check karo ki Malik ka hi bill hai)
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.shopOwnerId },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ success: false, message: "Bill nahi mila!" });
    if (order.status === "CANCELLED") return res.status(400).json({ success: false, message: "Yeh bill pehle hi cancel ho chuka hai!" });

    // Transaction: Bill cancel karo aur Stock wapas badao
    await prisma.$transaction(async (tx) => {
      // 1. Bill ka status CANCELLED karo aur amount 0 kar do taki Revenue mein na gine
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", paidAmount: 0, totalAmount: 0 } 
      });

      // 2. Jo samaan bika tha, usko wapas Inventory mein daal do
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.qty } }
        });
      }
    });

    res.status(200).json({ success: true, message: "Bill cancel ho gaya aur stock wapas jud gaya!" });
  } catch (error) {
    console.error("Cancel Bill Error:", error);
    res.status(500).json({ success: false, message: "Bill cancel karne mein error aaya" });
  }
});

app.get('/api/udhaar', auth, async (req, res) => {
  try {
    let queryCondition = { userId: req.shopOwnerId, OR: [{ status: "UDHAAR" }, { status: "PARTIAL" }] };
    
    // Agar login karne wala EMPLOYEE hai, toh use sirf uski banayi hui parchiyan dikhao
    if (req.userRole === "EMPLOYEE") {
      queryCondition.createdById = req.userId;
    }

    const pendingOrders = await prisma.order.findMany({
      where: queryCondition,
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: pendingOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Udhaar fetch error" });
  }
});

app.put('/api/orders/:id/pay', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.shopOwnerId } }); 
    
    if (!order) return res.status(404).json({ success: false, message: "Parchi nahi mili!" });

    const newPaidAmount = order.paidAmount + Number(amount);
    let newStatus = newPaidAmount >= order.totalAmount ? "PAID" : "PARTIAL";
    
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { paidAmount: newPaidAmount, status: newStatus }
    });

    res.status(200).json({ success: true, message: "Khata update ho gaya!", data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment update error" });
  }
});


// ==========================================
// 4. SUPPLIERS (MAHAJAN) APIs (MASTER BUCKET LINKED)
// ==========================================

app.post('/api/suppliers', auth, async (req, res) => {
  try {
    const { name, company, mobile, address } = req.body;
    const newSupplier = await prisma.supplier.create({ 
      data: { name, company, mobile, address, userId: req.shopOwnerId } // Dukkan ka Mahajan
    });
    res.status(201).json({ success: true, message: "Mahajan ka khata khul gaya!", data: newSupplier });
  } catch (error) {
    res.status(500).json({ success: false, message: "Supplier save error" });
  }
});

app.get('/api/suppliers', auth, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { userId: req.shopOwnerId },
      include: { purchases: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });

    const data = suppliers.map(sup => {
      const totalBilled = sup.purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const paidInBills = sup.purchases.reduce((acc, curr) => acc + curr.paidAmount, 0);
      const standalonePayments = sup.payments.reduce((acc, curr) => acc + curr.amount, 0);
      
      return { ...sup, totalBilled, totalPaid: paidInBills + standalonePayments, currentDue: totalBilled - (paidInBills + standalonePayments) };
    });

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const start = (page - 1) * limit;
      return res.status(200).json({ 
        success: true, 
        data: data.slice(start, start + limit),
        pagination: { currentPage: page, totalPages: Math.ceil(data.length / limit), totalItems: data.length }
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Suppliers fetch error" });
  }
});

app.get('/api/suppliers/:id', auth, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, userId: req.shopOwnerId },
      include: {
        purchases: { 
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } }
        },
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!supplier) return res.status(404).json({ success: false, message: "Mahajan nahi mila!" });
    res.status(200).json({ success: true, data: supplier });
    
  } catch (error) {
    res.status(500).json({ success: false, message: "Khata load karne mein error" });
  }
});

app.post('/api/suppliers/:id/pay', auth, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findFirst({ where: { id: req.params.id, userId: req.shopOwnerId } });
    if (!supplier) return res.status(403).json({ success: false, message: "Unauthorized" });

    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: "Sahi amount dalein" });

    const payment = await prisma.supplierPayment.create({
      data: { supplierId: req.params.id, amount: Number(amount) } // Tracking aage add kar sakte hain ki kisne pay kiya
    });
    res.status(200).json({ success: true, message: "Payment chuka di gayi!", data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment update error" });
  }
});

app.post('/api/purchases', auth, async (req, res) => {
  try {
    const { supplierId, items, paidAmount } = req.body;
    let totalAmount = items.reduce((acc, item) => acc + (item.qty * item.buyPrice), 0);

    let status = "PAID";
    if (Number(paidAmount) === 0) status = "UDHAAR";
    else if (Number(paidAmount) < totalAmount) status = "PARTIAL";

    const result = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          userId: req.shopOwnerId,       // Dukkan ke stock mein jayega
          createdById: req.userId,       // Jis employee ne stock entry mari
          createdByName: req.userName,   // Employee ka naam
          supplierId,
          totalAmount,
          paidAmount: Number(paidAmount) || 0,
          status: status,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              qty: Number(item.qty),                 // Base addition
              buyPrice: Number(item.buyPrice),       // Base price
              enteredQty: Number(item.enteredQty || item.qty),
              enteredUnit: item.enteredUnit || "Base"
            }))
          }
        }
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { 
            stockQty: { increment: Number(item.qty) },
            buyPrice: Number(item.buyPrice)
          }
        });
      }

      return newPurchase;
    });

    res.status(201).json({ success: true, message: "Purchase recorded successfully!", data: result });
  } catch (error) {
    console.error("Purchase API Error:", error);
    res.status(500).json({ success: false, message: "Failed to record purchase" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Engine Start! Server port ${PORT} par mast chal raha hai...`);
});