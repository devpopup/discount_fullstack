'use client'

import React, { useState, useEffect } from 'react'
import { apiRequest, endpoints } from '@/lib/api'
import BusinessLayout from '@/components/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Eye, MousePointer, Gift, TrendingUp, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react'

const AnalyticsPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30')
  const [businessAnalytics, setBusinessAnalytics] = useState(null)
  const [offersAnalytics, setOffersAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const timeRangeOptions = [
    { value: '1', label: '24h' },
    { value: '7', label: '7d' },
    { value: '30', label: '30d' }
  ]

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setError('')

      const [businessResult, offersResult] = await Promise.all([
        apiRequest(`${endpoints.businessAnalytics}?time_range=${selectedTimeRange}`, {
          method: 'GET'
        }),
        apiRequest(`${endpoints.offersAnalyticsList}?time_range=${selectedTimeRange}&limit=20`, {
          method: 'GET'
        })
      ])

      if (businessResult.success && businessResult.data) {
        setBusinessAnalytics(businessResult.data.data || businessResult.data)
      } else {
        throw new Error(businessResult.error || 'Failed to fetch business analytics')
      }

      if (offersResult.success && offersResult.data) {
        setOffersAnalytics(offersResult.data)
      } else {
        throw new Error(offersResult.error || 'Failed to fetch offers analytics')
      }

    } catch (error) {
      setError(error.message || 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount and when time range changes
  useEffect(() => {
    fetchAnalytics()
  }, [selectedTimeRange])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalytics()
  }

  const handleTimeRangeChange = (newRange) => {
    if (newRange) {
      setSelectedTimeRange(newRange)
      setLoading(true)
    }
  }

  // Get stats data from business analytics
  const getStatsData = () => {
    if (!businessAnalytics?.summary) {
      return [
        { label: 'Active Offers', value: '0', icon: Gift, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
        { label: 'Total Views', value: '0', icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { label: 'Total Clicks', value: '0', icon: MousePointer, color: 'text-green-500', bgColor: 'bg-green-500/10' },
        { label: 'Total Claims', value: '0', icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' }
      ]
    }

    const { summary } = businessAnalytics
    return [
      { label: 'Active Offers', value: summary.active_offers?.toString() || '0', icon: Gift, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
      { label: 'Total Views', value: summary.total_views?.toString() || '0', icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
      { label: 'Total Clicks', value: summary.total_clicks?.toString() || '0', icon: MousePointer, color: 'text-green-500', bgColor: 'bg-green-500/10' },
      { label: 'Total Claims', value: summary.total_claims?.toString() || '0', icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' }
    ]
  }

  if (loading && !refreshing) {
    return (
      <BusinessLayout
        activeTab="analytics"
        title="Analytics"
        subtitle="Track your offers performance and metrics"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading analytics data...</p>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  const statsData = getStatsData()
  const selectedTimeRangeLabel = timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label || 'Last 30 days'

  return (
    <BusinessLayout
      activeTab="analytics"
      title="Analytics"
      subtitle={businessAnalytics?.time_range || selectedTimeRangeLabel}
      showRefresh={true}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Range Selection */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Time Range</h2>
            <p className="text-sm text-slate-400">
              {businessAnalytics?.period ?
                `${businessAnalytics.period.start} to ${businessAnalytics.period.end}` :
                'Select a time range to view analytics'
              }
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={selectedTimeRange}
            onValueChange={handleTimeRangeChange}
            className="justify-start"
          >
            {timeRangeOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="data-[state=on]:bg-orange-600 data-[state=on]:text-white"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <CardDescription className="text-slate-400">{stat.label}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Offers Analytics Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div>
              <CardTitle className="text-white">Offers Performance</CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                {offersAnalytics?.time_range || selectedTimeRangeLabel}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-slate-700 text-sm font-medium text-slate-400">
            <div className="col-span-5">Offer</div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />
                <span>Views</span>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <MousePointer className="w-4 h-4" />
                <span>Clicks</span>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Gift className="w-4 h-4" />
                <span>Claims</span>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">CTR</span>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-700">
            {(!offersAnalytics?.offers || offersAnalytics.offers.length === 0) ? (
              <div className="p-8 text-center">
                <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No offers data available</p>
                <p className="text-sm text-slate-500">
                  {businessAnalytics?.summary?.active_offers === 0
                    ? 'Create your first active offer to start tracking analytics'
                    : 'No data available for the selected time range'
                  }
                </p>
              </div>
            ) : (
              offersAnalytics.offers.map((offer) => (
                <div key={offer.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-slate-700/50 transition-colors">
                  {/* Offer Info */}
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {offer.product?.image_url ? (
                        <img
                          src={offer.product.image_url}
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gift className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-white mb-1 truncate">{offer.title}</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">
                          {offer.discount_type === 'percentage' ? `${offer.discount_value}% off` : `$${offer.discount_value} off`}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                          offer.time_left === 'Expired' ? 'bg-red-600 text-white' : 'bg-slate-600 text-slate-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {offer.time_left}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {offer.current_claims || 0}/{offer.max_claims || '∞'} claimed
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="col-span-2 text-center">
                    <span className="text-white font-medium">{offer.metrics.views}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-white font-medium">{offer.metrics.clicks}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-white font-medium">{offer.metrics.claims}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs text-slate-400">
                      {offer.metrics.click_through_rate}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </BusinessLayout>
  )
}

export default AnalyticsPage
