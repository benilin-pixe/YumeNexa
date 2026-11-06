/**
 * Formats Firebase Auth and Firestore errors into user-friendly messages for the UI.
 * Prevents raw JSON errors from leaking to users while keeping detailed diagnostics in logs.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let rawMessage = '';
  let errorCode = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
    if ('code' in (error as any)) {
      errorCode = String((error as any).code);
    }
  } else if (typeof error === 'object' && error !== null) {
    rawMessage = JSON.stringify(error);
  }

  // Check if rawMessage is a stringified FirestoreErrorInfo JSON payload
  if (rawMessage.startsWith('{') && rawMessage.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed.error) {
        rawMessage = parsed.error;
      }
    } catch {
      // Not JSON, continue with raw string
    }
  }

  const lower = rawMessage.toLowerCase();

  // Firestore permission or write errors
  if (
    lower.includes('missing or insufficient permissions') ||
    lower.includes('permission_denied') ||
    lower.includes('permission-denied')
  ) {
    return 'Permission error: Account profile could not be updated. Please try again or contact support.';
  }

  // Firebase Auth Error Codes
  if (
    errorCode === 'auth/email-already-in-use' ||
    lower.includes('email-already-in-use') ||
    lower.includes('email already in use')
  ) {
    return 'This email address is already registered. Please sign in or reset your password.';
  }

  if (
    errorCode === 'auth/invalid-email' ||
    lower.includes('invalid-email') ||
    lower.includes('invalid email')
  ) {
    return 'Please enter a valid email address.';
  }

  if (
    errorCode === 'auth/user-not-found' ||
    lower.includes('user-not-found') ||
    lower.includes('user not found')
  ) {
    return 'No account found with this email. Please verify your address or create a new account.';
  }

  if (
    errorCode === 'auth/wrong-password' ||
    errorCode === 'auth/invalid-credential' ||
    lower.includes('wrong-password') ||
    lower.includes('invalid-credential') ||
    lower.includes('invalid credential')
  ) {
    return 'Incorrect email or password. Please double-check your credentials and try again.';
  }

  if (
    errorCode === 'auth/weak-password' ||
    lower.includes('weak-password') ||
    lower.includes('at least 6 characters')
  ) {
    return 'Password must be at least 6 characters long.';
  }

  if (
    errorCode === 'auth/too-many-requests' ||
    lower.includes('too-many-requests')
  ) {
    return 'Too many unsuccessful attempts. Access is temporarily paused. Please try again in a few minutes.';
  }

  if (
    errorCode === 'auth/network-request-failed' ||
    lower.includes('network-request-failed') ||
    lower.includes('client is offline') ||
    lower.includes('econnreset')
  ) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  if (
    errorCode === 'auth/operation-not-allowed' ||
    lower.includes('operation-not-allowed')
  ) {
    return 'Email and password authentication is not enabled. Please contact support.';
  }

  if (
    errorCode === 'auth/user-disabled' ||
    lower.includes('user-disabled')
  ) {
    return 'This account has been disabled by an administrator. Please contact support.';
  }

  if (
    errorCode === 'auth/requires-recent-login' ||
    lower.includes('requires-recent-login')
  ) {
    return 'This sensitive action requires recent authentication. Please sign in again and retry.';
  }

  // Clean out technical wrappers such as "Firebase: " or "(auth/xyz)"
  const cleaned = rawMessage
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/i, '')
    .trim();

  return cleaned || 'Authentication failed. Please check your details and try again.';
}
