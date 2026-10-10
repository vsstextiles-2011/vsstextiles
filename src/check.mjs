import { allProducts } from './src/data/products.js'
const tshirts = allProducts.filter(p => p.menuParent === 'T-Shirt' || p.menuParent === 'T-Shirts')
const byCat = {}
tshirts.forEach(p => { byCat[p.category] = (byCat[p.category]||0)+1 })
console.log(byCat)
console.log('total', tshirts.length)
// check groupSlug values
const slugs = new Set(tshirts.map(p=>p.groupSlug))
console.log('groupSlugs', [...slugs])
