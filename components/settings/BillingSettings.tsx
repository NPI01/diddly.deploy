'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/SimpleAuthProvider'
import { useFlavor } from '@/components/flavors/FlavorProvider'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Star, 
  Zap, 
  Crown, 
  CheckCircle, 
  ExternalLink,
  AlertTriangle,
  Gift
} from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
  current?: boolean
}

export function BillingSettings() {
  const { user } = useAuth()
  const { theme } = useFlavor()
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading current subscription
    setTimeout(() => {
      // For now, set everyone to free plan
      setCurrentPlan({
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: ['5 articles per month', 'Basic AI editing', 'Standard templates'],
        current: true
      })
      setLoading(false)
    }, 1000)
  }, [])

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        '5 articles per month',
        'Basic AI editing',
        'Standard templates',
        'Export to Ghost, Medium, Substack'
      ],
      current: currentPlan?.id === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      interval: 'month',
      features: [
        'Unlimited articles',
        'Advanced AI agents (parallel execution)',
        'Custom prompt templates',
        'Priority support',
        'Advanced analytics',
        'Custom publishing workflows'
      ],
      popular: true,
      current: currentPlan?.id === 'pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Custom AI model training',
        'API access',
        'White-label solution',
        'Dedicated support'
      ],
      current: currentPlan?.id === 'enterprise'
    }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Billing & Subscription</h2>
        <p className="text-gray-600">Manage your subscription and billing information.</p>
      </div>

      {/* Current Plan */}
      {currentPlan && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>Current Plan</span>
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{currentPlan.name}</h4>
              <p className="text-gray-600">
                {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/${currentPlan.interval}`}
              </p>
            </div>
            
            {currentPlan.id !== 'free' && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Next billing date</p>
                <p className="font-medium text-gray-900">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stripe Integration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Gift className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Stripe Integration Coming Soon</h4>
            <p className="text-sm text-blue-700 mt-1">
              We're working on integrating Stripe for seamless subscription management. 
              For now, enjoy the free tier with full access to our AI writing tools!
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="space-y-6">
        <h3 className="font-medium text-gray-900">Available Plans</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
                plan.current
                  ? theme.id === 'purple-sherbert'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
            >
              {plan.popular && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                  theme.id === 'purple-sherbert'
                    ? 'bg-gradient-to-r from-violet-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-primary to-accent text-white'
                }`}>
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-600">/{plan.interval}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current || plan.id !== 'free'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  plan.current
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.id === 'free'
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {plan.current ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods (Placeholder) */}
      <div className="mt-12">
        <h3 className="font-medium text-gray-900 mb-4">Payment Methods</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">No payment methods</h4>
          <p className="text-gray-600 text-sm mb-4">
            Payment methods will be available when Stripe integration is complete.
          </p>
          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Add Payment Method (Coming Soon)
          </button>
        </div>
      </div>

      {/* Billing History (Placeholder) */}
      <div className="mt-8">
        <h3 className="font-medium text-gray-900 mb-4">Billing History</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">No billing history</h4>
          <p className="text-gray-600 text-sm">
            Your billing history will appear here once you have an active subscription.
          </p>
        </div>
      </div>
    </div>
  )
}
