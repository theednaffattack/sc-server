import { DOMParser } from "xmldom";

export function deserialize(htmlString: string) {
  const document = new DOMParser().parseFromString(htmlString, "text/html");
  console.log("DESERIALIZE CALLED", {
    document,
    type: document.nodeType,
    keys: Object.keys(document),
  });
  return deserializeFunc(document.documentElement, htmlString);
}

// @ts-ignore
function deserializeFunc(el: any, originalHtmlString: string) {
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  }

  // @ts-ignore
  const children: any = Array.from(el.childNodes).map(deserializeFunc);

  if (el.nodeType === "IMG") {
    console.log("ELEMENT SRC ATTR", el.getAttribute("src"));

    return `<img src='${el.getAttribute("src")}' />`;
  } else {
    return el;
  }
}
