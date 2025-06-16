import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, CheckCircle, BarChart3 } from "lucide-react";
import type { Order, ContactMessage } from "@shared/schema";

export default function AdminAnalytics() {
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: messages = [] } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact'],
  });

  // Calculate analytics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const processingOrders = orders.filter(order => order.status === 'processing').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

  const totalVolume = orders.reduce((sum, order) => sum + parseFloat(order.sendAmount), 0);
  const completedVolume = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + parseFloat(order.sendAmount), 0);

  const avgOrderValue = totalOrders > 0 ? totalVolume / totalOrders : 0;

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentOrders = orders.filter(order => 
    new Date(order.createdAt) >= sevenDaysAgo
  );

  const recentMessages = messages.filter(message => 
    new Date(message.createdAt) >= sevenDaysAgo
  );

  // Popular currency pairs
  const currencyPairs = orders.reduce((acc, order) => {
    const pair = `${order.sendMethod.toUpperCase()} → ${order.receiveMethod.toUpperCase()}`;
    acc[pair] = (acc[pair] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPairs = Object.entries(currencyPairs)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
        <p className="text-lg text-gray-600">Comprehensive insights into platform performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{recentOrders.length} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-3xl font-bold text-gray-900">${totalVolume.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">Avg: ${avgOrderValue.toFixed(2)}/order</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">{completedOrders}/{totalOrders} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-3xl font-bold text-gray-900">{messages.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">+{recentMessages.length} this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                Pending
              </span>
              <Badge className="bg-yellow-100 text-yellow-800">{pendingOrders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                Processing
              </span>
              <Badge className="bg-blue-100 text-blue-800">{processingOrders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Completed
              </span>
              <Badge className="bg-green-100 text-green-800">{completedOrders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
                Cancelled
              </span>
              <Badge className="bg-red-100 text-red-800">{cancelledOrders}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Popular Currency Pairs */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Currency Pairs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPairs.length > 0 ? (
              topPairs.map(([pair, count], index) => (
                <div key={pair} className="flex justify-between items-center">
                  <span className="font-medium">{pair}</span>
                  <Badge variant="outline">{count} orders</Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No currency pairs yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <div key={order.orderId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium">{order.orderId}</p>
                      <p className="text-sm text-gray-600">{order.fullName}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(order.sendAmount, order.sendMethod)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length > 0 ? (
                recentMessages.slice(0, 5).map((message) => (
                  <div key={message.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium">{message.name}</p>
                      <Badge variant="outline">{message.subject}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{message.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(message.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent messages</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}