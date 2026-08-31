const fs = require('fs');
let content = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

// 1. Import updateVehicle
content = content.replace(
  "const { vehicles, loadVehicles, isLoading, error } = useVehicleStore()",
  "const { vehicles, loadVehicles, updateVehicle, isLoading, error } = useVehicleStore()"
);

// 2. Add handleStatusChange function after handleListing
const handleListingLine = "  const handleListing = (vehicleId: string) => {\n    navigate(`/marketing?vehicle=${vehicleId}`)\n  }";
const handleStatusChange = `  const handleStatusChange = async (vehicleId: string, newStatus: Vehicle['status']) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) return
    await updateVehicle({ ...vehicle, status: newStatus, updatedAt: new Date().toISOString() })
  }

  const handleSales = (vehicleId: string) => {
    navigate(`/sales?vehicle=${vehicleId}`)
  }

  const handleCustomers = (vehicleId: string) => {
    navigate(`/customers?vehicle=${vehicleId}`)
  }`;
content = content.replace(handleListingLine, handleListingLine + '\n\n' + handleStatusChange);

// 3. Remove owner name line
content = content.replace(
  "                {vehicle.ownerName && <p className=\"text-sm text-gray-600\"><span className=\"font-medium\">Owner:</span> {vehicle.ownerName}</p>}",
  ""
);

// 4. Replace status badge with dropdown
const oldStatusBadge = `                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                  vehicle.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                  vehicle.status === 'sold' ? 'bg-red-100 text-red-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {vehicle.status}
                </span>`;

const newStatusDropdown = `                <select
                  value={vehicle.status}
                  onChange={(e) => handleStatusChange(vehicle.id, e.target.value as Vehicle['status'])}
                  className="absolute top-2 right-2 z-10 bg-white border border-gray-300 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>`;

content = content.replace(oldStatusBadge, newStatusDropdown);

// 5. Replace action buttons grid with flex wrap including Sales and Customers
const oldActions = `                <div className="grid grid-cols-4 gap-2 mt-4">
                  <button
                    onClick={() => handleListing(vehicle.id)}
                    className="bg-purple-50 text-purple-700 px-2 py-2 rounded-lg text-xs font-medium hover:bg-purple-100"
                  >
                    Listing
                  </button>
                  <button
                    onClick={() => handleReports(vehicle.id)}
                    className="bg-blue-50 text-blue-700 px-2 py-2 rounded-lg text-xs font-medium hover:bg-blue-100"
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => handleView(vehicle.inspectionId)}
                    className="bg-amber-50 text-amber-700 px-2 py-2 rounded-lg text-xs font-medium hover:bg-amber-100"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(vehicle.inspectionId)}
                    className="bg-indigo-50 text-indigo-700 px-2 py-2 rounded-lg text-xs font-medium hover:bg-indigo-100"
                  >
                    Edit
                  </button>
                </div>`;

const newActions = `                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => handleSales(vehicle.id)} className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-100">Sales</button>
                  <button onClick={() => handleCustomers(vehicle.id)} className="bg-pink-50 text-pink-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-pink-100">Customers</button>
                  <button onClick={() => handleListing(vehicle.id)} className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-100">Listing</button>
                  <button onClick={() => handleReports(vehicle.id)} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100">Reports</button>
                  <button onClick={() => handleView(vehicle.inspectionId)} className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-100">View</button>
                  <button onClick={() => handleEdit(vehicle.inspectionId)} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-100">Edit</button>
                </div>`;

content = content.replace(oldActions, newActions);

fs.writeFileSync('src/pages/Inventory.tsx', content);
console.log('Inventory cards updated');
