export default function Footer() {
  return <footer className="footer">
    <div><img
          src="https://vcdhkxcwyohbjweaqatw.supabase.co/storage/v1/object/public/CATALOGO/Logos/sapo%20logo%20definitivo.png"
          alt="Logo de ZAPO"
          className="site-logo"
        /></div>
    <p>© {new Date().getFullYear()} ZAPO. Proyecto académico.</p>
  </footer>;
}
