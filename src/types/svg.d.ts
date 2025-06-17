declare module "*.svg?react" {
    import type { FunctionComponent, SVGProps } from "react"
    const SVGComponent: FunctionComponent<SVGProps<SVGSVGElement>>
    export default SVGComponent
}

declare module "*.svg" {
    import type { FunctionComponent, SVGProps } from "react"
    const SVGComponent: FunctionComponent<SVGProps<SVGSVGElement>>
    export default SVGComponent
}
