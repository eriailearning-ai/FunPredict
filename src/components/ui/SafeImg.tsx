'use client'

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string
}

export default function SafeImg({ fallbackSrc, onError, src, ...props }: Props) {
  function handleError(e: React.SyntheticEvent<HTMLImageElement>) {
    if (fallbackSrc && (e.target as HTMLImageElement).src !== fallbackSrc) {
      ;(e.target as HTMLImageElement).src = fallbackSrc
    } else {
      ;(e.target as HTMLImageElement).style.display = 'none'
    }
    onError?.(e)
  }
  return <img src={src} onError={handleError} {...props} />
}
