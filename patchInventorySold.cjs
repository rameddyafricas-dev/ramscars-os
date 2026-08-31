const fs = require('fs');
let content = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

// Replace card map block to handle sold view-only and status colors
const oldMapStart = "          {filtered.map((vehicle) => {";
const oldMapEnd = "          })}";
const start = content.indexOf(oldMapStart);
const end = content.indexOf(oldMapEnd, start) + oldMapEnd.length;

if (start === -1 || end === -1) {
  console.error('map block not found');
  process.exit(1);
}

const newMap = `          {filtered.map((vehicle) => {
            const isSold = vehicle.status === 'sold';
            const statusColor = vehicle.status === 'available' ? 'bg-green-50 text-green-700 border-green-300' :
              vehicle.status === 'reserved' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
              vehicle.status === 'sold' ? 'bg-red-50 text-red-700 border-red-300' :
              'bg-gray-50 text-gray-500 border-gray-300';
            return (
              <div key={vehicle.id} className={`card overflow-hidden ${isSold ? 'opacity-80' : ''}`}>
                <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                  {vehicle.photos && vehicle.photos.length > 0 ? (
                    <img
                      src={vehicle.photos[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No photo</span>
                  )}
                  <select
                    value={vehicle.status}
                    onChange={(e) => handleStatusChange(vehicle.id, e.target.value as Vehicle['status'])}
                    disabled={isSold}
                    className={`absolute top-2 right-2 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm border ${statusColor} ${isSold ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">VIN:</span> {vehicle.vin || '-'}</p>
                    <p><span className="font-medium">Mileage:</span> {vehicle.mileage.toLocaleString()} km</p>
                    {vehicle.listingPrice !== undefined && (
                      <p className="text-green-700 font-medium">R {vehicle.listingPrice.toLocaleString()}</p>
                    )}
                    <p><span className="font-medium">Stock:</span> {vehicle.stockNumber || '-'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => handleSales(vehicle.id)} disabled={isSold} className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed">Sales</button>
                    <button onClick={() => handleCustomers(vehicle.id)} disabled={isSold} className="bg-pink-50 text-pink-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-pink-100 disabled:opacity-50 disabled:cursor-not-allowed">Customers</button>
                    <button onClick={() => handleListing(vehicle.id)} className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-100">Listing</button>
                    <button onClick={() => handleReports(vehicle.id)} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100">Reports</button>
                    <button onClick={() => handleView(vehicle.inspectionId)} className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-100">View</button>
                    <button onClick={() => handleEdit(vehicle.inspectionId)} disabled={isSold} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                  </div>
                </div>
              </div>
            );
          })}`;

content = content.substring(0, start) + newMap + content.substring(end);
fs.writeFileSync('src/pages/Inventory.tsx', content);
console.log('Inventory sold behavior and status colors patched');
