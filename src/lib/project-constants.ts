// Project color palette with light/dark variants
export const PROJECT_COLORS = [
    {
        id: "blue",
        name: "Blue",
        class: "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800/50"
    },
    {
        id: "red",
        name: "Red",
        class: "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50"
    },
    {
        id: "green",
        name: "Green",
        class: "text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800/50"
    },
    {
        id: "purple",
        name: "Purple",
        class: "text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800/50"
    },
    {
        id: "orange",
        name: "Orange",
        class: "text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-800/50"
    },
    {
        id: "pink",
        name: "Pink",
        class: "text-pink-600 bg-pink-100 border-pink-200 dark:text-pink-400 dark:bg-pink-900/30 dark:border-pink-800/50"
    },
    {
        id: "teal",
        name: "Teal",
        class: "text-teal-600 bg-teal-100 border-teal-200 dark:text-teal-400 dark:bg-teal-900/30 dark:border-teal-800/50"
    },
    {
        id: "gray",
        name: "Gray",
        class: "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800/30 dark:border-gray-700/50"
    }
] as const

export type ProjectColorId = (typeof PROJECT_COLORS)[number]["id"]

// Common project icons (emojis)
export const PROJECT_ICONS = [
    "📁",
    "💼",
    "🔬",
    "💡",
    "📚",
    "🎯",
    "🚀",
    "⚡",
    "🔥",
    "🌟",
    "💰",
    "🎨",
    "🛠️",
    "📊",
    "🏆",
    "🎮",
    "🌐",
    "📱",
    "💻",
    "📝",
    "🔍",
    "🧠",
    "❤️",
    "✨"
] as const

export type ProjectIcon = (typeof PROJECT_ICONS)[number]

// Get project color classes
export function getProjectColorClasses(colorId: ProjectColorId | undefined): string {
    if (!colorId)
        return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800/30 dark:border-gray-700/50"

    const color = PROJECT_COLORS.find((c) => c.id === colorId)
    return (
        color?.class ||
        "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800/30 dark:border-gray-700/50"
    )
}

// Default project icon
export const DEFAULT_PROJECT_ICON = "📁"
