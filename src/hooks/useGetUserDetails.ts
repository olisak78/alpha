import { useAuthWithRole } from "./useAuthWithRole";

// Define the type for the 'me' parameter
interface MeData {
    fullName?: string;
    email?: string;
}

export function useGetUserDetails(me: MeData) {
    // Move useAuth call inside the hook function
    const { user } = useAuthWithRole();
    
    const displayName = user?.name || me.fullName;
    const displayEmail = user?.email || me.email;

    return { displayName, displayEmail, user };
}
