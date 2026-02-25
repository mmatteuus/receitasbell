export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 border-t py-6 mt-auto">
      <div className="container text-center text-sm text-muted-foreground">
        <p>
          Desenvolvido por{" "}
          <a
            href="https://mtsferreira.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-orange-600 hover:underline"
          >
            MtsFerreira
          </a>
        </p>
      </div>
    </footer>
  );
}