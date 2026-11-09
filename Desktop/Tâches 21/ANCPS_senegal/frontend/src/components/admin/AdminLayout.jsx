import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Sidebar */}
      <AdminSidebar />

      {/* Zone principale */}
      <div className="ml-64">
        
        {/* Header */}
        <AdminHeader />

        {/* Contenu de la page */}
        <main className="p-6">
          {children}
        </main>

      </div>
    </div>
  );
}

export default AdminLayout;