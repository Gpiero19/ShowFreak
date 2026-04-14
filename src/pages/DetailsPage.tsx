import { useParams } from 'react-router-dom'

export default function DetailsPage() {
  const { id } = useParams()

  return (
    <div className="details-page">
      <h1>Content Details</h1>
      <p>ID: {id}</p>
    </div>
  )
}
