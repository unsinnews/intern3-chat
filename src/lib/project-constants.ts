// Project color palette
export const PROJECT_COLORS = [
    { id: "blue", name: "Blue", class: "text-blue-600 bg-blue-100 border-blue-200" },
    { id: "red", name: "Red", class: "text-red-600 bg-red-100 border-red-200" },
    { id: "green", name: "Green", class: "text-green-600 bg-green-100 border-green-200" },
    { id: "purple", name: "Purple", class: "text-purple-600 bg-purple-100 border-purple-200" },
    { id: "orange", name: "Orange", class: "text-orange-600 bg-orange-100 border-orange-200" },
    { id: "pink", name: "Pink", class: "text-pink-600 bg-pink-100 border-pink-200" },
    { id: "teal", name: "Teal", class: "text-teal-600 bg-teal-100 border-teal-200" },
    { id: "gray", name: "Gray", class: "text-gray-600 bg-gray-100 border-gray-200" }
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
    if (!colorId) return "text-gray-600 bg-gray-100 border-gray-200"

    const color = PROJECT_COLORS.find((c) => c.id === colorId)
    return color?.class || "text-gray-600 bg-gray-100 border-gray-200"
}

// Default project icon
export const DEFAULT_PROJECT_ICON = "📁"
