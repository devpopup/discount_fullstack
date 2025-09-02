'use client'

import React, { useState, useEffect } from 'react'
import { apiRequest, endpoints } from '@/lib/api'
import BusinessLayout from '@/components/BusinessLayout'
import { RefreshCw, Eye, MousePointer, Gift, TrendingUp, Calendar, Clock } from 'lucide-react'

const AnalyticsPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30')
  const [businessAnalytics, setBusinessAnalytics] = useState(null)
  const [offersAnalytics, setOffersAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const timeRangeOptions = [
    { value: '1', label: 'Last 24 hours' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' }
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
        setBusinessAnalytics(businessResult.data)
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
    setSelectedTimeRange(newRange)
    setLoading(true)
  }

  // Get stats data from business analytics
  const getStatsData = () => {
    if (!businessAnalytics?.summary) {
      return [
        { label: 'Total Offers', value: '0', icon: Gift, color: 'text-orange-500' },
        { label: 'Total Views', value: '0', icon: Eye, color: 'text-blue-500' },
        { label: 'Total Clicks', value: '0', icon: MousePointer, color: 'text-green-500' },
        { label: 'Total Claims', value: '0', icon: TrendingUp, color: 'text-purple-500' }
      ]
    }

    const { summary } = businessAnalytics
    return [
      { label: 'Total Offers', value: summary.total_offers?.toString() || '0', icon: Gift, color: 'text-orange-500' },
      { label: 'Total Views', value: summary.total_views?.toString() || '0', icon: Eye, color: 'text-blue-500' },
      { label: 'Total Clicks', value: summary.total_clicks?.toString() || '0', icon: MousePointer, color: 'text-green-500' },
      { label: 'Total Claims', value: summary.total_claims?.toString() || '0', icon: TrendingUp, color: 'text-purple-500' }
    ]
  }

  if (loading && !refreshing) {
    return (
      <BusinessLayout
        activeTab="analytics"
        title="Analytics"
        subtitle="Track your offers performance and metrics"
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
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
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
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
          <div className="flex gap-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeRangeChange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-slate-700 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-slate-400">{stat.label}</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Offers Analytics Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Offers Performance</h2>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {offersAnalytics?.time_range || selectedTimeRangeLabel}
          </p>
        </div>

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
                {businessAnalytics?.summary?.total_offers === 0 
                  ? 'Create your first offer to start tracking analytics'
                  : 'No data available for the selected time range'
                }
              </p>
            </div>
          ) : (
            offersAnalytics.offers.map((offer) => (
              <div key={offer.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-slate-750 transition-colors">
                {/* Offer Info */}
                <div className="col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {offer.product?.image_url ? (
                      <img 
                        src={offer.product.image_url} 
                        alt={offer.title}
                        className="w-full h-full object-cover rounded-lg"
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
      </div>
    </BusinessLayout>
  )
}

export default AnalyticsPage