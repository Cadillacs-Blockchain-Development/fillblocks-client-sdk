import React from 'react';
import toast from 'react-hot-toast';

interface OrganizationKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationData: {
    success: boolean;
    organization: {
      _id: string;
      organizationName: string;
      organizationOwner: string;
      aboutMe: string;
      teamSize: number;
      createdAt: string;
      clientId: string;
      secretKey: string;
      wallet: string;
      walletPrivateKey: string;
      status: string;
      schemas: any[];
      updatedAt: string;
      __v: number;
    };
  } | null;
}

const OrganizationKeysModal: React.FC<OrganizationKeysModalProps> = ({
  isOpen,
  onClose,
  organizationData
}) => {
  if (!isOpen || !organizationData) return null;

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${keyName} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              🔑 Organization Keys
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* API Keys */}
          {organizationData.organization && (
            <div className="space-y-4 mb-6">
              <p className="text-gray-600 text-sm mb-4">
                Save these keys securely. They won't be shown again!
              </p>
              
              {/* Secret Key */}
              {organizationData.organization.secretKey && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-red-800">
                      Secret Key
                    </label>
                    <button
                      onClick={() => copyToClipboard(String(organizationData.organization.secretKey), 'Secret Key')}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-white rounded p-3 border border-red-200 font-mono text-xs break-all text-gray-700">
                    {String(organizationData.organization.secretKey)}
                  </div>
                </div>
              )}

              {/* Client ID (API Key) */}
              {organizationData.organization.clientId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-blue-800">
                      Client ID
                    </label>
                    <button
                      onClick={() => copyToClipboard(String(organizationData.organization.clientId), 'Client ID')}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-white rounded p-3 border border-blue-200 font-mono text-xs break-all text-gray-700">
                    {String(organizationData.organization.clientId)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationKeysModal;
