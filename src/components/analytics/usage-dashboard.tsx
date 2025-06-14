import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { Activity, BarChart3, TrendingUp, Zap } from "lucide-react"
import { useState } from "react"
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface UsageDashboardProps {
    className?: string
}

export function UsageDashboard({ className }: UsageDashboardProps) {
    const [timeframe, setTimeframe] = useState<"1d" | "7d" | "30d">("7d")

    const stats = useQuery(api.analytics.getMyUsageStats, { timeframe })
    const chartData = useQuery(api.analytics.getMyUsageChartData, { timeframe })

    const chartConfig = {
        requests: {
            label: "Requests",
            color: "hsl(var(--chart-1))"
        },
        tokens: {
            label: "Tokens",
            color: "hsl(var(--chart-2))"
        }
    } satisfies ChartConfig

    // Process chart data for display
    const processedChartData =
        chartData?.map((day) => ({
            date: day.date,
            totalRequests: day.totalRequests,
            totalTokens: day.totalTokens,
            ...Object.fromEntries(
                Object.entries(day.models).map(([modelId, data]) => [
                    modelId.replace(":", "_"), // Replace colon for chart compatibility
                    data.requests
                ])
            )
        })) || []

    // Process pie chart data for model distribution
    const pieChartData =
        stats?.modelStats.map((model, index) => ({
            name: model.modelName,
            value: model.requests,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        })) || []

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-semibold text-2xl tracking-tight">Usage Analytics</h2>
                    <p className="text-muted-foreground">
                        Track your API usage, token consumption, and model performance.
                    </p>
                </div>

                {/* Timeframe selector */}
                <Tabs
                    value={timeframe}
                    onValueChange={(value) => setTimeframe(value as "1d" | "7d" | "30d")}
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="1d">1 Day</TabsTrigger>
                        <TabsTrigger value="7d">7 Days</TabsTrigger>
                        <TabsTrigger value="30d">30 Days</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Total Requests</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl">{stats?.totalRequests || 0}</div>
                        <p className="text-muted-foreground text-xs">
                            in the last{" "}
                            {timeframe === "1d" ? "day" : timeframe === "7d" ? "7 days" : "30 days"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Total Tokens</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl">
                            {(stats?.totalTokens || 0).toLocaleString()}
                        </div>
                        <p className="text-muted-foreground text-xs">input + output + reasoning</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Models Used</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl">{stats?.modelStats.length || 0}</div>
                        <p className="text-muted-foreground text-xs">different models</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Avg per Request</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl">
                            {stats?.totalRequests
                                ? Math.round((stats?.totalTokens || 0) / stats.totalRequests)
                                : 0}
                        </div>
                        <p className="text-muted-foreground text-xs">tokens per request</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Requests over time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Requests Over Time</CardTitle>
                        <CardDescription>
                            Daily request volume for the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <LineChart data={processedChartData}>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line
                                    type="monotone"
                                    dataKey="totalRequests"
                                    stroke="var(--color-requests)"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Model distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Model Usage Distribution</CardTitle>
                        <CardDescription>Breakdown of requests by model</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Token usage over time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Token Consumption</CardTitle>
                        <CardDescription>Daily token usage for the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <BarChart data={processedChartData}>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="totalTokens" fill="var(--color-tokens)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Model details table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Model Details</CardTitle>
                        <CardDescription>Detailed breakdown by model</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.modelStats.map((model) => (
                                <div
                                    key={model.modelId}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium">{model.modelName}</div>
                                            <div className="text-muted-foreground text-sm">
                                                {model.requests} requests
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">
                                            {model.totalTokens.toLocaleString()}
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            {model.promptTokens.toLocaleString()} prompt +{" "}
                                            {model.completionTokens.toLocaleString()} completion
                                            {model.reasoningTokens > 0 &&
                                                ` + ${model.reasoningTokens.toLocaleString()} reasoning`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
