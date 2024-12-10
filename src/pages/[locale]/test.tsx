export function getStaticPaths() {
  return {
    paths: [
      { params: { locale: "en" } },
      { params: { locale: "fr" } }
    ],
    fallback: false
  }
}

export function getStaticProps() {
  return {
    props: {}
  }
}

export default function Page() {
  return <div>test</div>
}