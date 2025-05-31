import AdminDashboard from "@/page/AdminDashboard"
import BeritaDashboard from "@/page/BeritaDashboard"
import BodyDashboard from "@/page/BodyDashboard"
import KategoriDashboard from "@/page/KategoriDashboard"
import PenggunaDashboard from "@/page/PenggunaDashboard"
import PesananDashboard from "@/page/PesananDashboard"
import ProdukDashboard from "@/page/ProdukDashboard"
import ProfileDashboard from "@/page/ProfileDashboard"
import SettingDashboard from "@/page/SettingDashboard"
import VoucherDashboard from "@/page/VoucherDashboard"

const Body = ({ selected }) => {
  return (
    <div>
        {selected === "Dasbor" ? <BodyDashboard /> : null}
        {selected === "Produk" ? <ProdukDashboard /> : null}
        {selected === "Pesanan" ? <PesananDashboard /> : null}
        {selected === "Kategori" ? <KategoriDashboard /> : null}
        {selected === "Pengguna" ? <PenggunaDashboard /> : null}
        {selected === "Voucher" ? <VoucherDashboard /> : null}
        {selected === "Berita" ? <BeritaDashboard /> : null}
        {selected === "Admin" ? <AdminDashboard /> : null}
        {selected === "Setting" ? <SettingDashboard /> : null}
        {selected === "Profile" ? <ProfileDashboard /> : null}
    </div>
  )
}

export default Body