/// <reference types="chrome"/>

export function sanitizeText(text: string): string {
    // Remove excessive whitespace and trim
    return text.replace(/\s+/g, ' ').trim();
}

export function extractPageContent(): string {
    // Remove script and style elements
    const content = document.body.cloneNode(true) as HTMLElement;
    const scripts = content.getElementsByTagName('script');
    const styles = content.getElementsByTagName('style');
    
    while (scripts.length > 0) {
        scripts[0].parentNode?.removeChild(scripts[0]);
    }
    while (styles.length > 0) {
        styles[0].parentNode?.removeChild(styles[0]);
    }
    
    return sanitizeText(content.innerText);
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}