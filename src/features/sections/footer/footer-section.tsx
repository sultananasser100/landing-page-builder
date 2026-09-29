import { Container } from "../shared/container";
import type { FooterData } from "./schema";

export function FooterSection({ id, data }: { id: string; data: FooterData }) {
  return (
    <footer id={id} className="border-t py-12">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-base font-semibold">{data.brandName}</p>
          {data.tagline ? (
            <p className="mt-2 text-sm text-muted-foreground">{data.tagline}</p>
          ) : null}
        </div>
        {data.links.length > 0 ? (
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {data.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </Container>
      <Container>
        <p className="mt-10 text-sm text-muted-foreground">{data.copyright}</p>
      </Container>
    </footer>
  );
}
