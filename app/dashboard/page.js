import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function DashboardPage() {
    return (
        <>
            <Sidebar/>
            <main style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <TopBar title="DASHBOARD"/>
                <div style={{padding: '32px', color: '#6b6b6b', fontSize: '14px'}}>
                    Em construção — clientes, invoices e leads aparecem aqui.
                </div>
            </main>
        </>
    )
}