export const isSuperAdmin = (email: string | undefined | null): boolean => {
    if (!email) return false;
    
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    return adminEmails.includes(email.toLowerCase());
}; 