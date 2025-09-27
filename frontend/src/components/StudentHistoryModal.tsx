import React, { useState, useEffect } from 'react';
import { getStudentHistory } from '../utils/organizationApi';
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

  useEffect(() => {
    if (isOpen && student?.data?._id) {
      fetchStudentHistory();
    }
  }, [isOpen, student?.data?._id]);

  const fetchStudentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getStudentHistory(schemaName, student.data._id, token);
      
      if (response.success) {
        setHistory(response.history || []);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                <img 
                  className="h-12 w-12 rounded-full" 
                  src={student?.data?.profile_picture || '/default-avatar.png'} 
                  alt="Profile" 
                />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {student?.data?.name || 'Unknown Student'}
                </h2>
                <p className="text-sm text-gray-600">
                  {student?.data?.email} • ID: {student?.data?._id}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  History for {schemaName} schema
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
              
              {history.map((record, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">📋</span>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Record #{index + 1}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {record.data?.createdAt ? new Date(record.data.createdAt).toLocaleString() : 'No date'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {record.data && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Name:</label>
                          <p className="text-sm text-gray-900">{record.data.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Email:</label>
                          <p className="text-sm text-gray-900">{record.data.email || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Phone:</label>
                          <p className="text-sm text-gray-900">{record.data.phone_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Roll Number:</label>
                          <p className="text-sm text-gray-900">{record.data.roll_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">DOB:</label>
                          <p className="text-sm text-gray-900">
                            {record.data.dob ? new Date(record.data.dob).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Current School:</label>
                          <p className="text-sm text-gray-900">{record.data.current_school || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Assigned Class:</label>
                          <p className="text-sm text-gray-900">{record.data.assign_class || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Medical Notes:</label>
                          <p className="text-sm text-gray-900">{record.data.medical_notes || 'None'}</p>
                        </div>
                      </div>
                    )}
                    
                    {record.txId && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="text-xs font-medium text-gray-500">Transaction ID:</label>
                        <p className="text-xs text-gray-600 font-mono break-all">{record.txId}</p>
                      </div>
                    )}
                    
                    {record.timestamp && (
                      <div className="mt-2">
                        <label className="text-xs font-medium text-gray-500">Blockchain Timestamp:</label>
                        <p className="text-xs text-gray-600">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
