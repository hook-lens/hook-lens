interface FileData {
  source: string;
  content: string;
}

export const loadFiles = async (files: File[]): Promise<FileData[]> => {
  const promises = [];

  for (const file of files) {
    if (
      !file.webkitRelativePath.includes("node_modules") &&
      (file.name.endsWith(".js") || file.name.endsWith(".jsx"))
    ) {
      promises.push(
        file.text().then((text: string) => ({
          source: file.webkitRelativePath,
          content: text,
        }))
      );
    }
  }

  return Promise.all(promises);
};
