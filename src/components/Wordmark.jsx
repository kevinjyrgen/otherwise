/**
 * Our team logo. This is a smaller copy of public/logo.png with the green
 * background made see-through, so it sits on any of our dark surfaces
 * without a frame. Deliberately not Wise's logo.
 * @param {{big?: boolean}} props `big` fills the column, for the landing page
 */
export default function Wordmark({ big = false }) {
  return (
    <img
      src="/logo-web.png"
      alt="OtherWise"
      width={900}
      height={300}
      // The picture has some air on its left; pull it back so the mark lines up with the text below.
      className={big ? 'h-auto w-full' : '-ml-2 h-14 w-auto'}
    />
  )
}
