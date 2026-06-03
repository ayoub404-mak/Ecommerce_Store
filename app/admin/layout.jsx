import AdminLayout from "@/components/admin/AdminLayout";
import { SignIn } from "@clerk/nextjs"; // ✅ Only import SignIn (SignedIn/SignedOut are removed in v5)
import { auth } from "@clerk/nextjs/server"; // ✅ Import auth for server-side checking

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

// ✅ Make the layout async so we can use await auth()
export default async function RootAdminLayout({ children }) {
    // ✅ Check if the user is logged in on the server
    const { userId } = await auth();

    return (
        <>
            {userId ? (
                // If logged in, show the admin layout
                <AdminLayout>
                    {children}
                </AdminLayout>  
            ) : (
                // If not logged in, show the Clerk Sign In component
                <div className="min-h-screen flex items-center justify-center">
                    <SignIn fallbackRedirectUrl="/admin" routing="hash" />
                </div>
            )}
        </>
    );
}