
export async function testJSZip(): Promise<boolean> {
  try {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.error("JSZip is not available");
      return false;
    }

    const zip = new JSZip();
    zip.file("test.txt", "Hello World");
    
    const blob = await zip.generateAsync({ type: "blob" });
    console.log("JSZip test successful, blob size:", blob.size);
    return blob.size > 0;
  } catch (error) {
    console.error("JSZip test failed:", error);
    return false;
  }
}
