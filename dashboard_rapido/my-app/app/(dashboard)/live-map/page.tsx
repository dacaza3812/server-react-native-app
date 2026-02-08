"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getLiveCaptains, getStores } from '@/lib/api';
import { CaptainLocation, Store } from '@/types';
import { Map, MapMarker, MarkerContent, MarkerPopup, MapControls } from '@/components/ui/map';

// Default location: Las Tunas, Cuba
const DEFAULT_CENTER: [number, number] = [-76.95441383298188, 20.961204224981];

export default function LiveMapPage() {
  const [captains, setCaptains] = useState<CaptainLocation[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch captains and stores
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [captainsData, storesData] = await Promise.all([
          getLiveCaptains(),
          getStores({ isActive: 'true', limit: '100' })
        ]);
        setCaptains(captainsData.captains || []);
        setStores(storesData.stores || []);
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa en Vivo</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ubicaciones en tiempo real
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Choferes ({captains.length})</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
              <span>Tiendas ({stores.length})</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="w-full h-[600px] rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <Map 
                center={DEFAULT_CENTER} 
                zoom={13}
                className="w-full h-full"
              >
                <MapControls position="top-right" showZoom showCompass />
                
                {/* Captain Markers */}
                {captains.map((captain) => (
                  <MapMarker
                    key={captain.id}
                    longitude={captain.coords.longitude}
                    latitude={captain.coords.latitude}
                  >
                    <MarkerContent>
                      <div className="relative">
                        <div className="w-8 h-8 bg-green-500 border-3 border-white rounded-full shadow-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">🚗</span>
                        </div>
                      </div>
                      <MarkerPopup closeButton>
                        <div className="p-2 min-w-[150px]">
                          <h3 className="font-semibold text-gray-900">Chofer</h3>
                          <p className="text-sm text-gray-600">
                            {captain.profile?.name || 'Sin nombre'} {captain.profile?.lastName || ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{captain.phone || 'N/A'}</p>
                          {captain.vehicle && (
                            <p className="text-xs text-gray-500">
                              {captain.vehicle.type} - {captain.vehicle.licensePlate}
                            </p>
                          )}
                        </div>
                      </MarkerPopup>
                    </MarkerContent>
                  </MapMarker>
                ))}

                {/* Store Markers */}
                {stores.map((store) => (
                  <MapMarker
                    key={store._id}
                    longitude={store.address.longitude}
                    latitude={store.address.latitude}
                  >
                    <MarkerContent>
                      <div className="relative">
                        <div className="w-8 h-8 bg-amber-500 border-3 border-white rounded-md shadow-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">🏪</span>
                        </div>
                      </div>
                      <MarkerPopup closeButton>
                        <div className="p-2 min-w-[150px]">
                          <h3 className="font-semibold text-gray-900">{store.name}</h3>
                          <p className="text-sm text-gray-600">{store.address.street}</p>
                          <p className="text-xs text-gray-500 mt-1">{store.address.city}</p>
                          <p className="text-xs text-gray-500">{store.contact?.phone || 'N/A'}</p>
                        </div>
                      </MarkerPopup>
                    </MarkerContent>
                  </MapMarker>
                ))}
              </Map>
            </div>

            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-sm">
              <p className="font-medium">Ubicación:</p>
              <p className="text-gray-600">Las Tunas, Cuba</p>
              <p className="text-xs text-gray-500 mt-1">
                Actualizado cada 10 segundos
              </p>
            </div>
          </div>
        )}

        {/* Captain List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Choferes Activos ({captains.length})
          </h3>
          {captains.length === 0 ? (
            <p className="text-gray-500">No hay choferes activos en este momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {captains.map((captain) => (
                <div
                  key={captain.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">
                        {captain.profile?.name?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {captain.profile?.name} {captain.profile?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{captain.phone}</p>
                      {captain.vehicle && (
                        <p className="text-xs text-gray-400">
                          {captain.vehicle.type} - {captain.vehicle.licensePlate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Lat: {captain.coords.latitude.toFixed(6)}</p>
                    <p>Lng: {captain.coords.longitude.toFixed(6)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tiendas Activas ({stores.length})
          </h3>
          {stores.length === 0 ? (
            <p className="text-gray-500">No hay tiendas activas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.slice(0, 12).map((store) => (
                <div
                  key={store._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-md flex items-center justify-center">
                      <span className="text-amber-600 text-lg">🏪</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{store.name}</p>
                      <p className="text-sm text-gray-500 truncate">{store.address.street}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {store.categories?.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
