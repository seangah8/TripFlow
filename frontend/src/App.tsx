import { usePlaces } from './hooks/usePlaces'

function App() {
  const { data: places, isLoading, error } = usePlaces('Paris')

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {places?.map((place) => (
        <li key={place.id}>{place.name}</li>
      ))}
    </ul>
  )
}

export default App
