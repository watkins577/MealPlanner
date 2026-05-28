import { Recipe } from '@/lib/types'
import { formatTime } from '@/lib/utils'

interface Props {
  recipe: Recipe
  onClick: () => void
}

export default function RecipeCard({ recipe, onClick }: Props) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <div onClick={onClick} className="block group cursor-pointer h-full">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-green-200 transition-all h-full flex flex-col">
        {recipe.image_url ? (
          <div className="h-44 bg-gray-100 overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl text-green-300 select-none">&#127859;</span>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">{recipe.name}</h3>
          {recipe.description && <p className="text-gray-500 text-sm mt-1 line-clamp-2 flex-1">{recipe.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
            {totalTime > 0 && <span>&#9201; {formatTime(totalTime)}</span>}
            {recipe.servings && <span>{recipe.servings} servings</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
