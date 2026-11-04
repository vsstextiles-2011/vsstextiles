// Page transitions removed — section/page navigation now swaps content
// instantly with no curtain/animation in between. Kept as a thin
// passthrough (instead of deleting it and updating every import) so
// nothing else needs to change; it simply renders whatever it's given.
export default function PageTransition({ children }) {
  return children
}
