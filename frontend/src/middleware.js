// import { NextResponse } from 'next/server';

// export function middleware(req) {
//   const path = req.nextUrl.pathname;
//   const isPublicPath = path === '/login';
  
//   // Abhi ke liye hum dummy cookie check kar rahe hain. 
//   // Backend se jab asli login banega, tab yeh real token use karega.
//   const token = req.cookies.get('auth_token')?.value || '';

//   // Agar private page par jaana chahta hai aur token nahi hai -> Login par fek do
//   if (!isPublicPath && !token) {
//     return NextResponse.redirect(new URL('/login', req.nextUrl));
//   }

//   // Agar pehle se login hai aur wapas login page khol raha hai -> Dashboard par bhej do
//   if (isPublicPath && token) {
//     return NextResponse.redirect(new URL('/', req.nextUrl));
//   }
// }

// // Yeh bouncer kin-kin darwazo par khada rahega:
// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
// };

import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check karo ki user ke paas auth_token cookie hai ya nahi
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Agar token NAHI hai aur user dashboard (ya kisi aur page) par jana chahta hai
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Agar token HAI aur user wapas login page par aana chahta hai (toh direct andar bhej do)
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Ye middleware sirf in pages par kaam karega (Images, CSS wagaira ko block nahi karega)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};