import PesananTable from "@/components/PesananTable"

const PesananDashboard = () => {
  return (
    <div className="bg-white mx-[3vh] my-[2vw] p-[3vw] rounded-[2vw]">
        <h1 className="text-[1.5vw] text-[#00C7BE]">Pesanan</h1>
        <PesananTable />
    </div>
  )
}

export default PesananDashboard