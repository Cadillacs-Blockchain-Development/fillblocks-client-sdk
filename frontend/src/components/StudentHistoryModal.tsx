import React, { useState, useEffect } from 'react';
import { getDataFromShemaAndSchemaAndStudentId, getStudentHistory, getStudentUid } from '../utils/organizationApi';
import toast from 'react-hot-toast';

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    data: {
      _id: string;
      name: string;
      email: string;
      profile_picture?: string;
    };
  };
  schemaName: string;
  token?: string;
}

const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  isOpen,
  onClose,
  student,
  schemaName,
  token
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && student?.data?._id) {
      fetchStudentHistory();
    }
  }, [isOpen, student?.data?._id]);

  const fetchStudentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getStudentHistory(schemaName, student.data._id, token);
      const uidResponse = await getStudentUid(student.data._id, token);
      const dataResponse = await getDataFromShemaAndSchemaAndStudentId("student", student.data._id, token);
      
      if (response.success && uidResponse && dataResponse.success) {
        setHistory(response.history || []);
        setUid(uidResponse?.user)
        setData(dataResponse?.data?.data || {})
        
        // Set student data from the specific schema response
        if (dataResponse?.allSchemas && dataResponse.allSchemas[1]?.getschemawiseData) {
          setStudentData(dataResponse.allSchemas[1].getschemawiseData);
        }
        
        toast.success(`Loaded ${response.history?.length || 0} history records`);
      } else {
        toast.error('Failed to fetch student history');
        setHistory([]);
      }
    } catch (error: any) {
      console.error('Error fetching student history:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to fetch student history';
      toast.error(errorMessage);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTxId = async (txId: string) => {
    try {
      await navigator.clipboard.writeText(txId);
      setCopiedTxId(txId);
      toast.success('Transaction ID copied to clipboard!');
      
      // Reset icon after 3 seconds
      setTimeout(() => {
        setCopiedTxId(null);
      }, 3000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy transaction ID');
    }
  };

  const formatId = (id: string, isTxId: boolean = false) => {
    if (isTxId) {
      // For transaction IDs, show first 8 and last 8 characters with dots
      if (id.length > 16) {
        return `${id.substring(0, 8)}...${id.substring(id.length - 8)}`;
      }
      return id;
    }
    // For regular IDs, don't truncate
    return id;
  };



  if (!isOpen) return null;
  console.log(student,"student");
  return (
    <div className="fixed inset-0 bg-[#00000099] bg-opacity-10 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                <img 
                  className="h-12 w-12 rounded-full" 
                  src={data?.profile_picture || '/default-avatar.png'} 
                  alt="Profile" 
                />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {data?.name || 'Student Name'}
                </h2>
                <p className="text-sm text-gray-600 flex items-center">
                 
                  {uid?.Uid && (
                     
                      <div className="flex justify-between items-center bg-transparent">
                        <span className="text-xs font-medium text-blue-600"> UID:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 ">
                            {formatId(uid?.Uid, true)}
                          </span>
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
                            title="Copy Transaction ID"
                            onClick={() => handleCopyTxId(uid?.Uid)}
                          >
                            {copiedTxId === uid?.Uid? (
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" fill="none"/>
                                <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" fill="none"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                  
                )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  History for {data?.name} student
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading student history...</span>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Student History ({history.length} records)
                </h3>
                <button
                  onClick={fetchStudentHistory}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
              
              {history.map((record, index) => {
                const getSchemaIcon = (schema: string) => {
                  switch (schema) {
                    case 'student': return '👨‍🎓';
                    case 'attendence': return '📅';
                    default: return '📋';
                  }
                };

                const getSchemaColor = (schema: string) => {
                  switch (schema) {
                    case 'student': return 'bg-blue-100 text-blue-800';
                    case 'attendence': return 'bg-green-100 text-green-800';
                    default: return 'bg-gray-100 text-gray-800';
                  }
                };

                const formatFieldValue = (key: string, value: any) => {
                  if (value === null || value === undefined || value === '') return 'N/A';
                  
                  // Handle date fields
                  if (key.includes('date') || key.includes('Date') || key.includes('dob') || key.includes('createdAt') || key.includes('updatedAt')) {
                    try {
                      return new Date(value).toLocaleDateString();
                    } catch {
                      return value;
                    }
                  }
                  
                  // Handle arrays
                  if (Array.isArray(value)) {
                    return value.length > 0 ? `${value.length} items` : 'Empty';
                  }
                  
                  // Handle objects
                  if (typeof value === 'object') {
                    return JSON.stringify(value);
                  }
                  
                  return value;
                };

                const getFieldLabel = (key: string) => {
                  const labelMap: { [key: string]: string } = {
                    '_id': 'ID',
                    'name': 'Name',
                    'email': 'Email',
                    'phone_number': 'Phone',
                    'roll_number': 'Roll Number',
                    'dob': 'Date of Birth',
                    'current_school': 'Current School',
                    'assign_class': 'Assigned Class',
                    'medical_notes': 'Medical Notes',
                    'profile_picture': 'Profile Picture',
                    'proof_of_identity': 'Proof of Identity',
                    'teacherId': 'Teacher ID',
                    'classId': 'Class ID',
                    'schoolId': 'School ID',
                    'date': 'Date',
                    'status': 'Status',
                    'notes': 'Notes',
                    'attendence': 'Attendance Date',
                    'createdAt': 'Created At',
                    'updatedAt': 'Updated At'
                  };
                  return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                };

                const isImportantField = (key: string) => {
                  const importantFields = ['name', 'email', 'status', 'date', 'roll_number', 'phone_number'];
                  return importantFields.includes(key);
                };

                const importantFields = record.data ? Object.keys(record.data).filter(isImportantField) : [];
                const otherFields = record.data ? Object.keys(record.data).filter(key => !isImportantField(key)) : [];

                return (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                          <span className="text-xl">{getSchemaIcon(record.schema)}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {record.schema.charAt(0).toUpperCase() + record.schema.slice(1)} Record #{index + 1}
                            <span className={`px-2 py-1 text-xs rounded-full ${getSchemaColor(record.schema)}`}>
                              {record.schema.toUpperCase()}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {record.data?.createdAt ? new Date(record.data.createdAt).toLocaleString() : 
                             record.data?.date ? new Date(record.data.date).toLocaleString() : 'No date'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Important Fields */}
                      {importantFields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {importantFields.map((key) => (
                            <div key={key} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                              <label className="text-xs font-semibold text-gray-600 block mb-2 uppercase tracking-wide">
                                {getFieldLabel(key)}
                              </label>
                              <p className="text-sm text-gray-900 font-medium">
                                {key === '_id' ? formatId(record.data[key], false) : formatFieldValue(key, record.data[key])}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Other Fields */}
                      {otherFields.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                          <h5 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Additional Details</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otherFields.map((key) => (
                              <div key={key} className="flex justify-between items-center py-1">
                                <span className="text-xs text-gray-500 font-medium">
                                  {getFieldLabel(key)}:
                                </span>
                                <span className="text-xs text-gray-700 text-right max-w-32 truncate font-mono">
                                  {key === '_id' ? formatId(record.data[key], false) : formatFieldValue(key, record.data[key])}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Transaction Details */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                        <h5 className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                          </svg>
                          Arweave Blockchain Details
                        </h5>
                        <div className="space-y-3">
                          {record.txId && (
                            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100">
                              <span className="text-xs font-medium text-blue-600">Transaction ID:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border">
                                  {formatId(record.txId, true)}
                                </span>
                                <button
                                  type="button"
                                  className="p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
                                  title="Copy Transaction ID"
                                  onClick={() => handleCopyTxId(record.txId)}
                                >
                                  {copiedTxId === record.txId ? (
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" fill="none"/>
                                      <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" fill="none"/>
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          )} 
                          {record.timestamp && (
                            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100">
                              <span className="text-xs font-medium text-blue-600">Timestamp:</span>
                              <span className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border">
                                {new Date(record.timestamp).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg font-medium mb-2">No history found</p>
              <p className="text-sm">This student has no history records</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHistoryModal;
