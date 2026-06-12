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
    const { name, phone, password, shopName, shopType, role, shopKey } = req.body;

    // ─── SECURITY VALIDATIONS ───
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Mobile number exactly 10 digits ka hona chahiye! Na kam, na zyada." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password kam se kam 6 characters ka hona chahiye!" });
    }

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
    const { name, mobile, village, openingBalance } = req.body;
    
    // Transaction mein chalayenge taaki Customer aur uska Udhaar dono ek sath save hon
    const newCustomer = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({ 
        data: { name, mobile, village, userId: req.shopOwnerId } 
      });

      // Agar Purana Udhaar (Opening Balance) hai, toh ek "System Parchi" bana do
      if (openingBalance && Number(openingBalance) > 0) {
        await tx.order.create({
          data: {
            userId: req.shopOwnerId,
            createdById: req.userId,
            createdByName: "System",
            customerId: customer.id,
            totalAmount: Number(openingBalance),
            paidAmount: 0,
            status: "UDHAAR",
            // Bina kisi item ke sirf pure amount ki entry
          }
        });
      }
      return customer;
    });

    res.status(201).json({ success: true, message: "Kisaan ka khata aur hisaab khul gaya!", data: newCustomer });
  } catch (error) {
    console.error("Customer Creation Error:", error);
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

    if (!amount || amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Amount hamesha 0 se bada aur number hona chahiye!" });
    }

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
    // Naye fields nikaale: isPackaged, packageUnit, qtyPerPackage
    const { name, brand, category, buyPrice, sellPrice, stockQty, unit, isPackaged, packageUnit, qtyPerPackage } = req.body;
    
    const newProduct = await prisma.product.create({
      data: { 
        name, brand: brand || "Local", category, 
        buyPrice: Number(buyPrice), sellPrice: Number(sellPrice), 
        stockQty: Number(stockQty) || 0, 
        unit, 
        isPackaged: Boolean(isPackaged),
        packageUnit: packageUnit || null,
        qtyPerPackage: qtyPerPackage ? Number(qtyPerPackage) : null,
        userId: req.shopOwnerId
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

// 🗑️ DELETE PRODUCT (INVENTORY)
app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Pehle check karo item exist karta hai ya nahi (aur kya wo ishi owner ka hai)
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.userId !== req.shopOwnerId) {
      return res.status(404).json({ success: false, message: "Item nahi mila ya aap iske owner nahi hain." });
    }

    // 2. Item ko Database se hamesha ke liye uda do
    await prisma.product.delete({
      where: { id: productId }
    });

    res.status(200).json({ success: true, message: "Item successfully deleted!" });

  } catch (error) {
    console.error("Delete API Error:", error);
    
    // 🚨 SMART FOREIGN KEY CHECK (Naye Prisma update ke hisaab se)
    const isForeignKeyError = 
      error.code === 'P2003' || 
      (error.cause && error.cause.originalCode === '23001') ||
      (error.message && error.message.includes('violates RESTRICT setting'));

    if (isForeignKeyError) {
      return res.status(400).json({ 
        success: false, 
        message: "Yeh item pehle kisi Parchi mein bik chuka hai. Isey delete kiya toh purane bill kharab ho jayenge. Kripya iska Stock 0 kar dein!" 
      });
    }

    res.status(500).json({ success: false, message: "Server error during deletion." });
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
              qty: Number(item.qty),                 // Base quantity (e.g., 0.5)
              priceAtSale: Number(item.priceAtSale), // Price per base unit
              enteredQty: Number(item.enteredQty || item.qty), 
              enteredUnit: item.enteredUnit || "Base",
              enteredPrice: Number(item.enteredPrice || item.priceAtSale), // NAYA: Ek bori/packet ka rate
              customLabel: item.customLabel || null                        // NAYA: Parchi par likha custom naam
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

// ─── SAMAAN WAPSI (SALES RETURN) API ───
app.post('/api/returns', auth, async (req, res) => {
  try {
    const { orderId, returnItems, refundAmount, reason } = req.body;

    // Pehle Parchi dhoondho
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.shopOwnerId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Original Parchi nahi mili!" });
    }

    // Transaction start: Return record banao, Stock badhao, Order ka hisaab update karo
    const result = await prisma.$transaction(async (tx) => {
      // 1. Wapsi ka record banao
      const returnRecord = await tx.salesReturn.create({
        data: {
          orderId,
          userId: req.shopOwnerId,
          createdById: req.userId,
          createdByName: req.userName,
          refundAmount: Number(refundAmount) || 0,
          reason: reason || "Customer Return",
          items: {
            create: returnItems.map(item => ({
              productId: item.productId,
              qty: Number(item.qty),
              returnPrice: Number(item.returnPrice),
              enteredQty: Number(item.enteredQty),
              enteredUnit: item.enteredUnit
            }))
          }
        }
      });

      // 2. Stock wapas Inventory mein jodo
      for (const item of returnItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: Number(item.qty) } }
        });
      }

      // 3. Parchi ka Bill Amount aur Paid Amount kam karo
      // Agar 500 ka bill tha aur 100 ka samaan wapas aaya, toh naya bill 400 ka hoga
      const newTotalAmount = Math.max(0, order.totalAmount - Number(refundAmount));
      // Assume karte hain ki wapsi ka paisa humne udhaar se kaata hai ya cash wapas kiya hai
      const newPaidAmount = Math.max(0, order.paidAmount - Number(refundAmount));
      
      let newStatus = order.status;
      if (newPaidAmount >= newTotalAmount && newTotalAmount > 0) newStatus = "PAID";
      else if (newPaidAmount === 0 && newTotalAmount > 0) newStatus = "UDHAAR";
      else if (newTotalAmount === 0) newStatus = "CANCELLED"; // Poora samaan wapas
      else newStatus = "PARTIAL";

      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: newTotalAmount, paidAmount: newPaidAmount, status: newStatus }
      });

      return returnRecord;
    });

    res.status(200).json({ success: true, message: "Samaan wapsi successfully record ho gayi aur stock update ho gaya!", data: result });
  } catch (error) {
    console.error("Sales Return Error:", error);
    res.status(500).json({ success: false, message: "Samaan wapsi record karne mein error aaya." });
  }
});


// ==========================================
// 4. SUPPLIERS (MAHAJAN) APIs (MASTER BUCKET LINKED)
// ==========================================

app.post('/api/suppliers', auth, async (req, res) => {
  try {
    const { name, company, mobile, address, openingBalance } = req.body;
    
    // Transaction taaki Supplier aur uska purana bill ek sath bane
    const newSupplier = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({ 
        data: { name, company, mobile, address, userId: req.shopOwnerId } 
      });

      // Agar Purana Baaki hai, toh ek "System Parchi" (Purchase) bana do
      if (openingBalance && Number(openingBalance) > 0) {
        await tx.purchase.create({
          data: {
            userId: req.shopOwnerId,
            createdById: req.userId,
            createdByName: "System",
            supplierId: supplier.id,
            totalAmount: Number(openingBalance),
            paidAmount: 0,
            status: "UDHAAR",
            // Bina kisi items array ke, direct totalAmount feed kiya
          }
        });
      }
      return supplier;
    });

    res.status(201).json({ success: true, message: "Mahajan ka khata aur purana hisaab khul gaya!", data: newSupplier });
  } catch (error) {
    console.error("Supplier Creation Error:", error);
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
              qty: Number(item.qty),                 
              buyPrice: Number(item.buyPrice),       
              enteredQty: Number(item.enteredQty || item.qty),
              enteredUnit: item.enteredUnit || "Base",
              enteredPrice: Number(item.enteredPrice || item.buyPrice),
              customLabel: item.customLabel || null    // 👈 YEH LINE JOD DI
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

// ─── CANCEL / DELETE PURCHASE BILL API ───
app.delete('/api/purchases/:id', auth, async (req, res) => {
  try {
    const purchaseId = req.params.id;

    // Pehle bill dhoondho (Taki confirm ho ki inhi ke godam ka bill hai)
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, userId: req.shopOwnerId },
      include: { items: true }
    });

    if (!purchase) return res.status(404).json({ success: false, message: "Bill nahi mila!" });

    // Transaction: Bill delete karo aur Stock wapas kam karo
    await prisma.$transaction(async (tx) => {
      // 1. Jo stock galti se add ho gaya tha, usko wapas minus karo
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.qty } }
        });
      }

      // 2. Bill ke items database se udao
      await tx.purchaseItem.deleteMany({ where: { purchaseId } });

      // 3. Main Bill udao
      await tx.purchase.delete({ where: { id: purchaseId } });
    });

    res.status(200).json({ success: true, message: "Kharidari ka bill delete ho gaya aur stock theek ho gaya!" });
  } catch (error) {
    console.error("Delete Purchase Error:", error);
    res.status(500).json({ success: false, message: "Bill delete karne mein error aaya." });
  }
});

// ─── USER SETTINGS UPDATE API ───
app.put('/api/settings/update', auth, async (req, res) => {
  try {
    const { role, shopName, securityQuestion, securityAnswer } = req.body;
    
    const cleanAnswer = securityAnswer ? securityAnswer.trim().toLowerCase() : null;

    // ─── NAYA LOGIC: KEY GENERATION ───
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    let newShopKey = user.shopKey;

    // Agar user Owner set kar raha hai aur uske paas pehle se key nahi hai
    if (role === "OWNER" && !newShopKey) {
      newShopKey = 'AGRO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { 
        role: role || undefined,
        shopName: shopName || undefined,
        shopKey: newShopKey, // Nayi key save ho jayegi
        securityQuestion: securityQuestion || undefined,
        securityAnswer: cleanAnswer || undefined
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Settings successfully update ho gayi!", 
      shopKey: newShopKey // Frontend ko key wapas bhej di
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Settings save karne mein दिक्कत aayi." });
  }
});

// ─── SECURE FORGOT PASSWORD API ───
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { phone, securityAnswer, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "Yeh mobile number system mein nahi hai." });
    }

    if (!user.securityQuestion || !user.securityAnswer) {
      return res.status(400).json({ success: false, message: "Aapne Security Question set nahi kiya tha. Kripya apne malik ya admin se contact karein." });
    }

    // User ke dale gaye jawab ko clean karke match karna
    const cleanInputAnswer = securityAnswer.trim().toLowerCase();
    if (cleanInputAnswer !== user.securityAnswer) {
      return res.status(400).json({ success: false, message: "Security answer galat hai! Koshish wapas karein." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password kam se kam 6 characters ka hona chahiye." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { phone },
      data: { password: hashedPassword }
    });

    res.status(200).json({ success: true, message: "Security check pass! Password badal gaya hai." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Password reset karne mein error aaya!" });
  }
});

// ─── ACCOUNT DELETION API ───
app.delete('/api/account/delete', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (user.role === "EMPLOYEE") {
      // Agar staff hai, toh sirf uska account delete karo. Dukaan safe rahegi.
      await prisma.user.delete({ where: { id: req.userId } });
      return res.status(200).json({ success: true, message: "Aapka Employee account delete ho gaya hai." });
    } 
    
    if (user.role === "OWNER") {
      // Agar Malik delete kar raha hai, toh poori dukaan ka safaya hoga (Transaction ke saath)
      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { order: { userId: req.userId } } }),
        prisma.order.deleteMany({ where: { userId: req.userId } }),
        prisma.purchaseItem.deleteMany({ where: { purchase: { userId: req.userId } } }),
        prisma.purchase.deleteMany({ where: { userId: req.userId } }),
        prisma.product.deleteMany({ where: { userId: req.userId } }),
        prisma.customer.deleteMany({ where: { userId: req.userId } }),
        prisma.supplier.deleteMany({ where: { userId: req.userId } }),
        prisma.user.deleteMany({ where: { shopKey: user.shopKey } }), // Saare employees bhi out
        prisma.user.delete({ where: { id: req.userId } }) // Aakhir mein malik delete
      ]);
      return res.status(200).json({ success: true, message: "Aapki dukaan ka poora data aur account delete ho gaya hai." });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Account delete karne mein bhari error aaya." });
  }
});

// ==========================================
// 🛡️ SUPER ADMIN (OVERSEER) APIs
// ==========================================
const SUPER_ADMIN_PASS = process.env.SUPER_ADMIN_PASS;

// 1. Admin Login Endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === SUPER_ADMIN_PASS) {
    // Admin ke liye special token (24 ghante ke liye)
    const adminToken = jwt.sign({ role: "SUPER_ADMIN" }, SECRET_KEY, { expiresIn: '24h' });
    return res.status(200).json({ success: true, token: adminToken });
  }
  return res.status(401).json({ success: false, message: "Intruder Alert! Access Denied." });
});

// Admin Middleware (Checking if token belongs to Super Admin)
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: "No Token" });
  
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], SECRET_KEY);
    if (decoded.role !== "SUPER_ADMIN") throw new Error("Not Admin");
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "Admin privileges required." });
  }
};

// 2. Fetch All Data (Dashboard Metrics & Identity Matrix)
app.get('/api/admin/system-data', adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, phone: true, role: true, status: true, shopName: true }
    });
    
    const totalOrders = await prisma.order.aggregate({ _sum: { totalAmount: true } });
    const shops = users.filter(u => u.role === "OWNER").length;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: users.length,
        activeShops: shops,
        platformVolume: totalOrders._sum.totalAmount || 0,
        systemHealth: "99.9%"
      },
      users: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "System Data Fetch Error" });
  }
});

// 3. User Actions (Suspend / Activate / Unlock Role)
app.post('/api/admin/user-action', adminAuth, async (req, res) => {
  try {
    const { userId, action } = req.body;
    
    if (action === "TOGGLE_STATUS") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });
      return res.status(200).json({ success: true, message: `User ${newStatus} successfully.` });
    }
    
    if (action === "UNLOCK_ROLE") {
      // Role ko khali kar diya taaki user wapas screen par edit kar sake
      await prisma.user.update({ where: { id: userId }, data: { role: "" } });
      return res.status(200).json({ success: true, message: "User role unlocked." });
    }

    if (action === "DELETE") {
      await prisma.user.delete({ where: { id: userId } });
      return res.status(200).json({ success: true, message: "User permanently deleted." });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: "Action failed." });
  }
});

// ==========================================
// 🔔 SMART NOTIFICATIONS SYSTEM
// ==========================================

// 1. GET: Notifications fetch karna (Aur purana kachra saaf karna)
app.get('/api/notifications', auth, async (req, res) => {
  try {
    // 36 Ghante pehle ka exact time nikalo
    const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000);

    // 🧹 SMART CLEANUP: Fetch karne se pehle 36 ghante purane messages UDA DO
    await prisma.notification.deleteMany({
      where: {
        userId: req.shopOwnerId,
        createdAt: { lt: thirtySixHoursAgo }
      }
    });

    // Ab sirf fresh aur bache hue notifications database se uthao
    const notifications = await prisma.notification.findMany({
      where: { userId: req.shopOwnerId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Ek baar mein 50 se zyada load mat karo (Performance ke liye)
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ success: false, message: "Notifications load nahi huye" });
  }
});

// 2. POST: Owner ya System ke through naya Announcement bhejna
app.post('/api/notifications', auth, async (req, res) => {
  try {
    const { message, type } = req.body; 
    // type = 'ALERT', 'TRANSACTION', ya 'ANNOUNCEMENT'

    const newNotif = await prisma.notification.create({
      data: {
        userId: req.shopOwnerId,
        message: message,
        type: type || 'ANNOUNCEMENT',
        createdBy: req.userName || 'System'
      }
    });

    res.status(201).json({ success: true, data: newNotif });
  } catch (error) {
    res.status(500).json({ success: false, message: "Announcement send error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Engine Start! Server port ${PORT} par mast chal raha hai...`);
});