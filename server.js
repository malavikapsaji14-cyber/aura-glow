const http = require('http');
  const querystring = require('querystring');
  const crypto = require('crypto');

  const PORT = 3000;

  // ======================
  // PRODUCT + REVIEW IMAGES
  // ======================

  const PRODUCT_IMAGE =
  "https://aura-glow-assets-malavika.s3.us-east-1.amazonaws.com/eyeshadow_palette.jpg";
  const REVIEW_IMAGE_1 =
  "https://aura-glow-assets-malavika.s3.us-east-1.amazonaws.com/product_1.jpg";

  const REVIEW_IMAGE_2 =
  "https://aura-glow-assets-malavika.s3.us-east-1.amazonaws.com/product_2.jpg";

  // ======================
  // DATABASES
  // ======================

  let reviews = [
  {
  id: 1,
  name: 'Emma',
  rating: '5.0',
  variant: 'Aurora Pink',
  comment:
  'The shimmer shades are absolutely stunning and blend perfectly. This palette became my everyday glam essential.',
  date: '2026.05.23',
  images: [REVIEW_IMAGE_1]
  },
  {
  id: 2,
  name: 'Sophia',
  rating: '5.0',
  variant: 'Soft Nude',
  comment:
  'Beautiful pigmentation and luxurious packaging. The colors stay vibrant all day long.',
  date: '2026.05.23',
  images: [REVIEW_IMAGE_2]
  }
  ];

  const adminPasswordHash = crypto
  .createHash('sha256')
  .update('admin123')
  .digest('hex');

  let usersDB = [
  {
  username: 'admin',
  passwordHash: adminPasswordHash,
  role: 'admin',
  cart: []
  },
  {
  username: 'testuser',
  passwordHash: crypto
  .createHash('sha256')
  .update('password123')
  .digest('hex'),
  role: 'user',
  cart: []
  }
  ];

  let activeUserSessions = new Set();
  let activeAdminSessions = new Set();

  // ======================
  // HELPERS
  // ======================

  function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;

  if (rc) {
  rc.split(';').forEach(cookie => {
  const parts = cookie.split('=');
  list[parts.shift().trim()] =
  decodeURIComponent(parts.join('='));
  });
  }

  return list;
  }

  function setSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  function escapeHTML(text){

  if(!text){
  return '';
  }

  return text
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#039;');

  }
  // ======================
  // AUTH PAGE
  // ======================

  function generateAuthPage(title, endpoint) {

  return `
  <!DOCTYPE html>
  <html>
  <head>
  <title>${title}</title>

  <style>

  body{
  margin:0;
  padding:0;
  background:#FFC0CB;
  font-family:'Times New Roman', serif;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  }

  .auth-box{
  width:350px;
  background:rgba(255,255,255,0.35);
  padding:40px;
  border-radius:20px;
  backdrop-filter:blur(10px);
  box-shadow:0 10px 30px rgba(0,0,0,0.1);
  }

  h1{
  text-align:center;
  margin-bottom:30px;
  }

  input{
  width:100%;
  padding:14px;
  margin-bottom:15px;
  border:none;
  border-radius:10px;
  font-size:16px;
  font-family:'Times New Roman', serif;
  }

  button{
  width:100%;
  padding:14px;
  background:black;
  color:white;
  border:none;
  border-radius:10px;
  font-size:16px;
  cursor:pointer;
  font-family:'Times New Roman', serif;
  }

  a{
  color:black;
  text-decoration:none;
  font-weight:bold;
  }

  </style>
  </head>

  <body>

  <div class="auth-box">

  <h1>${title}</h1>

  <form method="POST" action="${endpoint}">

  <input
  type="text"
  name="username"
  placeholder="Username"
  required
  />

  <input
  type="password"
  name="password"
  placeholder="Password"
  required
  />

  <button type="submit">Continue</button>

  </form>

  <br>

  <center>
  <a href="/">← Back To Store</a>
  </center>

  </div>

  </body>
  </html>
  `;
  }

  // ======================
  // MAIN STORE PAGE
  // ======================

  function generateMainStore(currentUser, cartCount) {

  let reviewHTML = '';

  reviews.forEach(review => {

  let imageHTML = '';

  review.images.forEach(img => {

  imageHTML += `
  <img
  src="${img}"
  style="
  width:120px;
  height:120px;
  object-fit:cover;
  border-radius:12px;
  margin-top:15px;
  border:1px solid rgba(0,0,0,0.1);
  "
  />
  `;

  });

  reviewHTML += `
  <div class="review-card">

  <div class="review-top">
  <strong>${review.name}</strong>
  <span>${review.date}</span>
  </div>

  <div class="review-variant">
  ${review.variant}
  </div>

  <p>
  ${review.comment}
  </p>

  ${imageHTML}

  </div>
  `;

  });

  const authSection = currentUser
  ? `
  <span>👤 ${currentUser}</span>

  <a href="/cart/view">
  🛒 Cart (${cartCount})
  </a>

  <a href="/user/logout">
  Logout
  </a>
  `
  : `
  <a href="/user/login">
  Customer Login
  </a>

  <a href="/user/register">
  Signup
  </a>
  `;

  return `
  <!DOCTYPE html>
  <html>

  <head>

  <title>AuraGlow Cosmetics</title>

  <style>

  body{
  margin:0;
  padding:0;
  background:#FFC0CB;
  font-family:'Times New Roman', serif;
  color:black;
  }

  .header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:25px 50px;
  border-bottom:1px solid rgba(0,0,0,0.1);
  }

  .header a{
  margin-left:20px;
  text-decoration:none;
  color:black;
  font-weight:bold;
  }

  .brand{
  font-size:28px;
  font-weight:bold;
  }

  .container{
  max-width:1200px;
  margin:60px auto;
  display:flex;
  gap:60px;
  padding:0 40px;
  }

  .left{
  width:50%;
  }

  .left img{
  width:100%;
  border-radius:20px;
  box-shadow:0 10px 30px rgba(0,0,0,0.15);
  }

  .right{
  width:50%;
  }

  .product-brand{
  font-size:16px;
  opacity:0.7;
  }

  .product-title{
  font-size:42px;
  margin:10px 0;
  }

  .rating{
  font-size:18px;
  margin-bottom:20px;
  }

  .price{
  font-size:38px;
  font-weight:bold;
  margin-bottom:20px;
  }

  .desc{
  line-height:1.8;
  font-size:18px;
  }

  .btn{
  display:block;
  width:100%;
  padding:18px;
  margin-top:20px;
  background:black;
  color:white;
  border:none;
  border-radius:12px;
  font-size:18px;
  cursor:pointer;
  font-family:'Times New Roman', serif;
  font-weight:bold;
  }

  .btn:hover{
  opacity:0.9;
  }

  .section{
  max-width:1100px;
  margin:80px auto;
  padding:0 40px;
  }

  .section h2{
  font-size:32px;
  margin-bottom:30px;
  }

  .review-card{
  background:rgba(255,255,255,0.35);
  padding:30px;
  margin-bottom:25px;
  border-radius:20px;
  backdrop-filter:blur(8px);
  }

  .review-top{
  display:flex;
  justify-content:space-between;
  margin-bottom:10px;
  }

  .review-rating{
  font-size:18px;
  font-weight:bold;
  margin-bottom:8px;
  }

  .review-variant{
  opacity:0.7;
  margin-bottom:10px;
  }

  .review-card p{
  line-height:1.7;
  font-size:17px;
  }

  .review-form{
  background:rgba(255,255,255,0.35);
  padding:30px;
  border-radius:20px;
  }

  .review-form input,
  .review-form textarea{
  width:100%;
  padding:14px;
  margin-bottom:15px;
  border:none;
  border-radius:10px;
  font-family:'Times New Roman', serif;
  font-size:16px;
  }

  .review-form textarea{
  height:140px;
  resize:none;
  }

  .btn-link{
  display:block;
  width:100%;
  padding:18px;
  margin-top:20px;
  background:black;
  color:white;
  border-radius:12px;
  font-size:18px;
  font-family:'Times New Roman', serif;
  font-weight:bold;
  text-align:center;
  text-decoration:none;
  box-sizing:border-box;
  }

  </style>

  </head>

  <body>

  <div class="header">

  <div class="brand">
    AuraGlow Cosmetics
  </div>

  <div>

  ${authSection}

  <a href="/admin/login">
  Admin
  </a>

  </div>

  </div>

  <div class="container">

  <div class="left">

  <img src="${PRODUCT_IMAGE}" />

  </div>

  <div class="right">

  <div class="product-brand">
  AuraGlow Cosmetics
  </div>

  <div class="product-title">
  Aurora Eyeshadow Palette
  </div>

  <div class="price">
  $20
  </div>

  <div class="desc">
  A luxurious eyeshadow palette featuring highly pigmented shimmer and matte shades crafted for soft glam and bold elegance.
  </div>

  <form action="/cart/add" method="POST">

  <button class="btn">
  Add To Cart
  </button>

  </form>

  <a href="/cart/view" class="btn-link">
  View Cart
  </a>

  </div>

  </div>

  <div class="section">

  <h2>Customer Reviews</h2>

  ${reviewHTML}

  </div>

  <div class="section">

  <h2>Write A Review</h2>

  <div class="review-form">

  <form action="/review/add" method="POST">

  <input
  type="text"
  name="name"
  placeholder="Your Name"
  required
  />

  <input
  type="text"
  name="variant"
  placeholder="Palette Variant"
  required
  />

  <textarea
  name="comment"
  placeholder="Share your beauty experience..."
  required
  ></textarea>

  <button class="btn">
  Submit Review
  </button>

  </form>

  </div>

  </div>

  </body>
  </html>
  `;
  }

  // ======================
  // CART PAGE
  // ======================

  function generateCartPage(user) {

  let cartHTML = '';

  if(user.cart.length === 0){

  cartHTML = `
  <h2>Your cart is empty.</h2>
  `;

  }else{

  user.cart.forEach((item,index)=>{

  cartHTML += `
  <div
  style="
  background:rgba(255,255,255,0.35);
  padding:25px;
  margin-bottom:20px;
  border-radius:20px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  ">

  <div>

  <h3>${item.name}</h3>

  <p>${item.price}</p>

  </div>

  <form
  method="POST"
  action="/cart/remove/${index}"
  >

  <button
  style="
  padding:10px 20px;
  background:black;
  color:white;
  border:none;
  border-radius:10px;
  cursor:pointer;
  "
  >
  Remove
  </button>

  </form>

  </div>
  `;

  });

  }

  return `
  <!DOCTYPE html>
  <html>

  <head>

  <title>Cart</title>

  <style>

  body{
  background:#FFC0CB;
  font-family:'Times New Roman', serif;
  padding:40px;
  }

  .container{
  max-width:800px;
  margin:auto;
  }

  .btn{
  width:100%;
  padding:18px;
  background:black;
  color:white;
  border:none;
  border-radius:12px;
  font-size:18px;
  cursor:pointer;
  font-family:'Times New Roman', serif;
  font-weight:bold;
  }

  a{
  text-decoration:none;
  color:black;
  font-weight:bold;
  }

  </style>

  </head>

  <body>

  <div class="container">

  <a href="/">← Continue Shopping</a>

  <h1>🛒 Shopping Cart</h1>

  ${cartHTML}

  ${
  user.cart.length > 0
  ?
  `
  <form action="/checkout" method="POST">

  <button class="btn">
  Proceed To Secure Checkout
  </button>

  </form>
  `
  :
  ''
  }

  </div>

  </body>

  </html>
  `;
  }

  // ======================
  // ADMIN DASHBOARD
  // ======================

  function generateAdminDashboard(){

  let reviewHTML = '';

  reviews.forEach(review=>{

  reviewHTML += `
  <div
  style="
  background:rgba(255,255,255,0.35);
  padding:25px;
  margin-bottom:20px;
  border-radius:20px;
  position:relative;
  "
  >

  <h3>${review.name}</h3>

  <p>${review.comment}</p>

  <form
  method="POST"
  action="/admin/review/delete/${review.id}"
  >

  <button
  style="
  background:red;
  color:white;
  border:none;
  padding:10px 20px;
  border-radius:10px;
  cursor:pointer;
  "
  >
  Delete Review
  </button>

  </form>

  </div>
  `;

  });

  let usersHTML = '';

  usersDB.forEach(user=>{

  if(user.role !== 'admin'){

  usersHTML += `
  <tr>

  <td
  style="
  padding:15px;
  border-bottom:1px solid rgba(0,0,0,0.1);
  "
  >
  ${user.username}
  </td>

  <td
  style="
  padding:15px;
  border-bottom:1px solid rgba(0,0,0,0.1);
  "
  >
  ${user.cart.length}
  </td>

  </tr>
  `;

  }

  });

  return `
  <!DOCTYPE html>
  <html>

  <head>

  <title>Admin Dashboard</title>

  <style>

  body{
  background:#FFC0CB;
  font-family:'Times New Roman', serif;
  padding:40px;
  }

  .card{
  background:rgba(255,255,255,0.35);
  padding:30px;
  border-radius:20px;
  margin-bottom:30px;
  }

  table{
  width:100%;
  border-collapse:collapse;
  }

  a{
  text-decoration:none;
  color:black;
  font-weight:bold;
  }

  </style>

  </head>

  <body>

  <a href="/admin/logout">
  Logout
  </a>

  <h1> AuraGlow Admin Dashboard</h1>

  <div class="card">

  <h2>Customer Cart Analytics</h2>

  <table>

  <tr>

  <th align="left">
  Customer
  </th>

  <th align="left">
  Products Added
  </th>

  </tr>

  ${usersHTML}

  </table>

  </div>

  <div class="card">

  <h2>Review Moderation</h2>

  ${reviewHTML}

  </div>

  </body>

  </html>
  `;
  }

 // ======================
// SERVER
// ======================

const server = http.createServer((req,res)=>{

setSecurityHeaders(res);

const cookies = parseCookies(req);

const userSession = cookies['user_session'];
const adminSession = cookies['admin_session'];

const currentUser = usersDB.find(
u=>
u.username === userSession &&
activeUserSessions.has(userSession)
);

// ======================
// HOME
// ======================

if(req.method === 'GET' && req.url === '/'){

res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(
  generateMainStore(
  currentUser ? currentUser.username : null,
  currentUser ? currentUser.cart.length : 0
  )
  );

  }

  // ======================
  // USER REGISTER
  // ======================

  else if(req.method === 'GET' && req.url === '/user/register'){

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(
  generateAuthPage(
  'Customer Signup',
  '/user/register'
  )
  );

  }

  else if(req.method === 'POST' && req.url === '/user/register'){

  let body='';

  req.on('data',chunk=>{
  body+=chunk.toString();
  });

  req.on('end',()=>{

  const data = querystring.parse(body);

  if(
  !data.username ||
  !data.password ||
  data.username.trim() === '' ||
  data.password.trim() === ''
  ){

  res.writeHead(200,{
  'Content-Type':'text/html; charset=utf-8'
  });

  return res.end(`
  <!DOCTYPE html>
  <html>
  <body>
  <script>
  alert('Username and password cannot be empty');
  window.location='/user/register';
  </script>
  </body>
  </html>
  `);

  }


  if(usersDB.some(u=>u.username===data.username)){

  res.writeHead(200, {
  'Content-Type':'text/html; charset=utf-8'
  });

  res.end(`
  <script>
  alert('Username already exists');
  window.location='/user/register';
  </script>
  `);

  }else{

  const hash = crypto
  .createHash('sha256')
  .update(data.password)
  .digest('hex');

  usersDB.push({
  username:escapeHTML(data.username),
  passwordHash:hash,
  role:'user',
  cart:[]
  });

  res.writeHead(200, {
  'Content-Type':'text/html; charset=utf-8'
  });

  res.end(`
  <script>
  alert('Signup successful');
  window.location='/user/login';
  </script>
  `);
  }

  });

  }

  // ======================
  // USER LOGIN
  // ======================

  else if(req.method === 'GET' && req.url === '/user/login'){

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(
  generateAuthPage(
  'Customer Login',
  '/user/login'
  )
  );

  }

  else if(req.method === 'POST' && req.url === '/user/login'){

  let body='';

  req.on('data',chunk=>{
  body+=chunk.toString();
  });

  req.on('end',()=>{

  const data = querystring.parse(body);

  // VALIDATION
  if(
  !data.username ||
  !data.password ||
  data.username.trim() === '' ||
  data.password.trim() === ''
  ){

  res.writeHead(200,{
  'Content-Type':'text/html; charset=utf-8'
  });

  return res.end(`
  <!DOCTYPE html>
  <html>
  <body>
  <script>
  alert('Username and password cannot be empty');
  window.location='/user/login';
  </script>
  </body>
  </html>
  `);

  }


  // HASH PASSWORD
  const hash = crypto
  .createHash('sha256')
  .update(data.password)
  .digest('hex');

  const match = usersDB.find(
  u=>
  u.username===data.username &&
  u.passwordHash===hash &&
  u.role==='user'
  );

  if(match){

  activeUserSessions.add(match.username);

  res.writeHead(302,{
  'Set-Cookie':
  `user_session=${match.username}; Path=/; HttpOnly; SameSite=Strict`,
  'Location':'/'
  });

  res.end();

  }else{

  res.writeHead(200, {
  'Content-Type':'text/html; charset=utf-8'
  });

  res.end(`
  <script>
  alert('Invalid credentials');
  window.location='/user/login';
  </script>
  `);

  }

  });

  }

  // ======================
  // USER LOGOUT
  // ======================

  else if(req.url === '/user/logout'){

  activeUserSessions.delete(userSession);

  res.writeHead(302,{
  'Set-Cookie':
  'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
  'Location':'/'
  });

  res.end();

  }

  // ======================
  // ADD TO CART
  // ======================

  else if(req.method === 'POST' && req.url === '/cart/add'){

  if(!currentUser){

  res.writeHead(200, {
  'Content-Type':'text/html; charset=utf-8'
  });

  res.end(`
  <script>
  alert('Please login first');
  window.location='/user/login';
  </script>
  `);

  return;
  }

  currentUser.cart.push({
  name:'Aurora Eyeshadow Palette',
  price:'$20'
  });

  res.writeHead(302,{
  'Location':'/cart/view'
  });

  res.end();

  }

  // ======================
  // VIEW CART
  // ======================

  else if(req.method === 'GET' && req.url === '/cart/view'){

  if(!currentUser){

  res.writeHead(302,{
  'Location':'/user/login'
  });

  res.end();
  return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(generateCartPage(currentUser));

  }

  // ======================
  // REMOVE FROM CART
  // ======================
  else if(
  req.method === 'POST' &&
  req.url.startsWith('/cart/remove/')
  ){

  // 1. CHECK USER FIRST (IMPORTANT)
  if(!currentUser){
    res.writeHead(302, { 'Location': '/user/login' });
    return res.end();
  }

  // 2. GET INDEX
  const idx = parseInt(req.url.split('/').pop());

  // 3. SAFE DELETE
  if(!isNaN(idx) && idx >= 0 && idx < currentUser.cart.length){
    currentUser.cart.splice(idx, 1);
  }

  // 4. REDIRECT BACK TO CART
  res.writeHead(302,{
  'Location':'/cart/view'
  });

  res.end();

  }

  // ======================
  // CHECKOUT
  // ======================

  else if(req.method === 'POST' && req.url === '/checkout'){

  // 1. CHECK USER FIRST (IMPORTANT)
  if(!currentUser){
    res.writeHead(302, { 'Location': '/user/login' });
    return res.end();
  }

  // 2. CLEAR CART
  currentUser.cart = [];

  // 3. SEND HTML WITH PROPER HEADER
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(`
  <!DOCTYPE html>
  <html>

  <head>

  <title>Payment Successful</title>

  <style>

  body{
  background:#FFC0CB;
  font-family:'Times New Roman', serif;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  }

  .box{
  background:rgba(255,255,255,0.35);
  padding:50px;
  border-radius:20px;
  text-align:center;
  }

  a{
  text-decoration:none;
  color:black;
  font-weight:bold;
  }

  </style>

  </head>

  <body>

  <div class="box">

  <h1>
    Payment Successful
  </h1>

  <p>
  Your order has been placed successfully using the sandbox payment gateway.
  </p>

  <a href="/">
  Return To Store
  </a>

  </div>

  </body>

  </html>
  `);

  }

  // ======================
  // ADD REVIEW
  // ======================

  else if(req.method === 'POST' && req.url === '/review/add'){

  let body='';

  req.on('data',chunk=>{
  body+=chunk.toString();
  });

  req.on('end',()=>{

  const data = querystring.parse(body);

  if(
  !data.name ||
  !data.variant ||
  !data.comment ||
  data.name.trim() === '' ||
  data.variant.trim() === '' ||
  data.comment.trim() === ''
  ){

  res.writeHead(302,{
  'Location':'/'
  });

  return res.end();

  }

  reviews.push({
  id:Date.now(),
  name:escapeHTML(data.name),
  rating:'5.0',
  variant:escapeHTML(data.variant),
  comment:escapeHTML(data.comment),
  date:'2026.05.23',
  images:[]
  });

  res.writeHead(302,{
  'Location':'/'
  });

  res.end();

  });

  }

  // ======================
  // ADMIN LOGIN
  // ======================

  else if(req.method === 'GET' && req.url === '/admin/login'){

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(
  generateAuthPage(
  'Admin Login',
  '/admin/login'
  )
  );

  }

  else if(req.method === 'POST' && req.url === '/admin/login'){

  let body='';

  req.on('data',chunk=>{
  body+=chunk.toString();
  });

  req.on('end',()=>{

  const data = querystring.parse(body);

  const hash = crypto
  .createHash('sha256')
  .update(data.password)
  .digest('hex');

  const admin = usersDB.find(
  u=>
  u.username===data.username &&
  u.passwordHash===hash &&
  u.role==='admin'
  );

  if(admin){

  const token = 'admin_'+Date.now();

  activeAdminSessions.add(token);

  res.writeHead(302,{
  'Set-Cookie':
  `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict`,
  'Location':'/admin/dashboard'
  });

  res.end();

  }else{

  res.writeHead(200, {
  'Content-Type':'text/html; charset=utf-8'
  });

  res.end(`
  <script>
  alert('Invalid admin credentials');
  window.location='/admin/login';
  </script>
  `);

  }

  });

  }

  // ======================
  // ADMIN DASHBOARD
  // ======================

  else if(req.url === '/admin/dashboard'){

  if(
  !adminSession ||
  !activeAdminSessions.has(adminSession)
  ){

  res.writeHead(302,{
  'Location':'/admin/login'
  });

  res.end();
  return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  res.end(generateAdminDashboard());
  }

  // ======================
  // DELETE REVIEW
  // ======================

  else if(
  req.method === 'POST' &&
  req.url.startsWith('/admin/review/delete/')
  ){

  // ADMIN PROTECTION
  if(
  !adminSession ||
  !activeAdminSessions.has(adminSession)
  ){

  res.writeHead(302,{
  'Location':'/admin/login'
  });

  return res.end();

  }

  const id = parseInt(
  req.url.split('/').pop()
  );

  reviews = reviews.filter(
  r=>r.id !== id
  );

  res.writeHead(302,{
  'Location':'/admin/dashboard'
  });

  res.end();

  }

  // ======================
  // ADMIN LOGOUT
  // ======================

  else if(req.url === '/admin/logout'){

  activeAdminSessions.delete(adminSession);

  res.writeHead(302,{
  'Set-Cookie':
  'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
  'Location':'/'
  });

  res.end();

  }

  // ======================
  // 404
  // ======================

  else{

  res.writeHead(404,{
  'Content-Type':'text/plain'
  });

  res.end('404 Not Found');

  }

  });

  // ======================
  // START SERVER
  // ======================

  server.listen(PORT,()=>{

  console.log(
  `Server running at http://localhost:${PORT}`
  );

  });