import NextTopLoader from 'nextjs-toploader'
import React from 'react'

export default function TopLoader() {
  return (
    <>
      <NextTopLoader
        color="#2d40e1"
        initialPosition={0.08}
        crawlSpeed={200}
        height={4}
        crawl={true}
        showSpinner={true}
        easing="ease"
        speed={200}
        shadow="0 0 10px #2d40b6,0 0 5px #2d40e1"
      />
    </>
  )
}