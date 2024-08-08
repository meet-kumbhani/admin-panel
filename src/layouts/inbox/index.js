import SoftBox from 'components/SoftBox'
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout'
import DashboardNavbar from 'examples/Navbars/DashboardNavbar'

const inbox = () => {
     return (
          <DashboardLayout>
               <DashboardNavbar />
               <SoftBox py={3}>
               </SoftBox>
          </DashboardLayout>
     )
}

export default inbox
