// Builds the mega-menu / shop-filter navigation structure directly from the
// live product catalog, instead of a separate hand-maintained config.
//
// Why: previously the nav (megaMenu.js) and the catalog (products.js) were
// two independent lists that had to be kept in sync by hand. Deleting a
// subcategory's products from Admin didn't remove it from the nav, and
// vice versa. Deriving the menu from whatever products currently exist
// means the two can never drift apart — delete every "Nighty" product
// under Women from the Admin panel and "Nighty" disappears from the nav
// and shop filters immediately, with no code change required.
import { toSlug } from '../data/products.js'

// Shape matches the old static megaMenu.js, with one addition: an item can
// carry `children` — a flyout list that only appears on hover instead of
// always being shown inline. Two ways an item gets children:
//   1. `menuParent` on a product (e.g. RN/RNS both set menuParent: 'Premium
//      Vest') — the products themselves become the flyout children of a
//      shared, non-sellable "Premium Vest" row.
//   2. `menuStyles` on a product (e.g. T-Shirts lists style names) — plain
//      label/slug pairs generated just for the flyout, no separate product
//      needed for each style.
// { [category]: [{ heading, image, items: [{ label, slug, children? }] }] }
export function buildMegaMenu(products) {
  const menu = {}

  products.forEach((p) => {
    if (!p.category || !p.subCategory) return
    if (!menu[p.category]) menu[p.category] = []

    const headingLabel = p.menuHeading || 'Other'
    let column = menu[p.category].find((col) => col.heading === headingLabel)
    if (!column) {
      // First product seen for this heading lends its photo to the column
      // thumbnail — no separate "menu category image" list to maintain.
      column = { heading: headingLabel, image: p.image, items: [] }
      menu[p.category].push(column)
    }

    if (p.menuParent) {
      // Group under a shared parent row instead of appearing as its own
      // top-level item — the parent isn't a real product, just a label
      // that reveals its children on hover. The parent's own `count` is
      // the sum of its children (see below), since no product actually
      // carries the parent's slug as its subCategory.
      let parent = column.items.find((item) => item.label === p.menuParent && item.isGroup)
      if (!parent) {
        parent = { label: p.menuParent, slug: toSlug(p.menuParent), isGroup: true, children: [], count: 0 }
        column.items.push(parent)
      }
      let child = parent.children.find((c) => c.slug === p.subCategory)
      if (!child) {
        child = { label: p.subCategoryLabel || p.subCategory, slug: p.subCategory, count: 0 }
        parent.children.push(child)
      }
      child.count += 1
      parent.count += 1
      return
    }

    let item = column.items.find((i) => i.slug === p.subCategory)
    if (!item) {
      item = { label: p.subCategoryLabel || p.subCategory, slug: p.subCategory, count: 0 }
      if (p.menuStyles?.length) {
        // These style names aren't real subcategories of their own — they
        // only exist for the flyout, so children link back through the
        // parent's real slug (`t-shirts`) with a `style` param rather than
        // a subcategory that has no matching products.
        item.children = p.menuStyles.map((style) => ({
          label: style,
          slug: toSlug(style),
          isStyle: true,
        }))
      }
      column.items.push(item)
    }
    item.count += 1
  })

  return menu
}
