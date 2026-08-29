const fs = require('fs');
let content = fs.readFileSync('src/pages/Inspection.tsx', 'utf8');

const oldStart = "          {(['documentation','exterior','interior','engine_bay'] as const).map((category) => (";
const oldEnd = "          ))}";
const startIdx = content.indexOf(oldStart);
const endIdx = content.indexOf(oldEnd, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Old checklist block not found');
  process.exit(1);
}

const newBlock = `          {(['documentation','exterior','interior','engine_bay','underbody'] as const).map((category) => {
            const titleMap: Record<string, string> = {
              documentation: 'Legal Documents',
              exterior: 'Exterior',
              interior: 'Interior',
              engine_bay: 'Engine Bay & Drive Train',
              underbody: 'Underbody & Suspension',
            };
            return (
              <div key={category} className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">{titleMap[category]}</h4>
                <div className="space-y-2">
                  {form.checklist.filter((c) => c.category === category).map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleChecklistResult(item.id, 'pass')} className={\`px-2 py-1 rounded-md text-xs font-medium \${item.result === 'pass' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-300'}\`}>Pass</button>
                        <button onClick={() => handleChecklistResult(item.id, 'advisory')} className={\`px-2 py-1 rounded-md text-xs font-medium \${item.result === 'advisory' ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-600 border border-yellow-300'}\`}>Advisory</button>
                        <button onClick={() => handleChecklistResult(item.id, 'fail')} className={\`px-2 py-1 rounded-md text-xs font-medium \${item.result === 'fail' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}\`}>Fail</button>
                        <button onClick={() => handleChecklistResult(item.id, 'na')} className={\`px-2 py-1 rounded-md text-xs font-medium \${item.result === 'na' ? 'bg-black text-white' : 'bg-white text-black border border-gray-300'}\`}>N/A</button>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                        <span title="Note">📝</span>
                        <input
                          value={item.note || ''}
                          onChange={(e) => handleChecklistNote(item.id, e.target.value)}
                          placeholder="Add note"
                          className="w-full text-sm bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}`;

content = content.substring(0, startIdx) + newBlock + content.substring(endIdx + oldEnd.length);
fs.writeFileSync('src/pages/Inspection.tsx', content);
console.log('patched');
