// Single source of truth for business identity. Footer, Contact page,
// printed bills and the policy pages all read from here -- edit once.
export const BUSINESS = {
  name: 'VSS Textiles',
  legalName: 'VSS Textiles', // TODO: replace with the exact registered name (as on GST / bank account)
  domain: 'vsstextiles.com',
  siteUrl: 'https://vsstextiles.com',
  email: 'vsstextiles2011@gmail.com', // the one email used everywhere on the site
  phone: '+91 98654 89201',
  landline: '04259 - 222492',
  gstin: '', // e.g. '33ABCDE1234F1Z5' -- shown on policy pages and bills when filled
  addressLines: [
    '57/1-2, Maruthi Nagar, Suleesvaranpatti',
    'Pollachi Taluk, Coimbatore, Tamil Nadu, India',
  ],
  pincode: '', // TODO: add the 6-digit pincode
  shortAddress: 'Pollachi, Tamil Nadu, India',
  // Policy numbers -- keep these matching what the site actually does.
  // Shipping is currently FREE on every order. To bring charges back, set
  // shippingFee (e.g. 79) and freeShippingAbove (e.g. 999) -- the cart,
  // checkout, banners and shipping policy all follow these two numbers.
  freeShippingAbove: 0,
  shippingFee: 0,
  deliveryDays: '3-7 business days',
  returnWindowDays: 7,
  refundDays: '5-7 business days',
}
export const POLICY_UPDATED = 'October 2026'
