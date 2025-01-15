export const isSuperAdmin = (email: string | undefined | null): boolean => {
    return email?.toLowerCase() === "abhishekibr.trainee2@gmail.com";
}; 