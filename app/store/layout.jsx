import StoreLayout from "@/components/store/StoreLayout";
import { SignIn } from "@clerk/nextjs"; // ✅ Only import SignIn
import { auth } from "@clerk/nextjs/server"; // ✅ Import auth for server-side checking

export const metadata = {
    title: "GoCart. - Store Dashboard",
    description: "GoCart. - Store Dashboard",
};

// ✅ FIX: Renamed to RootStoreLayout and made it async
export default async function RootStoreLayout({ children }) {
    // ✅ Check if the user is logged in on the server
    const { userId } = await auth();

    return (
        <>
            {userId ? (
                // If logged in, show the store layout
                <StoreLayout>
                    {children}
                </StoreLayout>  
            ) : (
                // If not logged in, show the Clerk Sign In component
                <div className="min-h-screen flex items-center justify-center">
                    <SignIn fallbackRedirectUrl="/store" routing="hash" />
                </div>
            )}
        </>
    );
}