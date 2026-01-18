/**
 * Client ID Management
 * Generates unique IDs per browser tab using sessionStorage
 */

let clientId: string | null = null;

function generateId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getClientId(): string {
  if (clientId) {
    return clientId;
  }

  // Check sessionStorage (unique per tab)
  const storedId = sessionStorage.getItem('client_id');
  
  if (storedId) {
    clientId = storedId;
  } else {
    clientId = generateId();
    sessionStorage.setItem('client_id', clientId);
  }

  return clientId;
}

export function clearClientId(): void {
  sessionStorage.removeItem('client_id');
  clientId = null;
}