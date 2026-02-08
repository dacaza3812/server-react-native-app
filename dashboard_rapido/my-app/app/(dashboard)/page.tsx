"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getStats } from '@/lib/api';
import { DashboardStats } from '@/types';
import {
  Users,
  Car,
  Package,
  Store,
  TrendingUp,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Usuarios Totales',
      value: stats?.users.total || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Choferes Activos',
      value: stats?.users.activeCaptains || 0,
      icon: Car,
      color: 'bg-green-500',
    },
    {
      title: 'Viajes Hoy',
      value: stats?.rides.today || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Entregas Hoy',
      value: stats?.deliveries.today || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'Tiendas Activas',
      value: stats?.stores.active || 0,
      icon: Store,
      color: 'bg-pink-500',
    },
    {
      title: 'Total Productos',
      value: stats?.products.total || 0,
      icon: Activity,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen general del sistema
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rides Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Estado de Viajes
            </h3>
            <div className="space-y-3">
              {stats?.rides.byStatus && Object.entries(stats.rides.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliveries Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Estado de Entregas
            </h3>
            <div className="space-y-3">
              {stats?.deliveries.byStatus && Object.entries(stats.deliveries.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/users"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Ver Usuarios</span>
            </a>
            <a
              href="/rides"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Car className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Ver Viajes</span>
            </a>
            <a
              href="/live-map"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Mapa en Vivo</span>
            </a>
            <a
              href="/stores"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Store className="h-8 w-8 text-pink-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Ver Tiendas</span>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
