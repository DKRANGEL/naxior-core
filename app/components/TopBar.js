export default function TopBar({title}) {
    return (
        <div style={{
            height: '60px', borderBottom: '1px solid #1f1f1f',
            display: 'flex', alignItems: 'center', padding: '0 32px',
            background: '#080808'
        }}>
            <h1 style={{
                fontSize: '14px', fontWeight: '600',
                color: '#fff', letterSpacing: '1px'
            }}>
                {title}
            </h1>
        </div>
    )
}