import { useEffect, useRef } from "react"

const vertexShaderSource = `
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}
`

const fragmentShaderSource = `
precision mediump float;

uniform float iTime;
uniform vec2 iResolution;

const vec3 PURPLE_GLOW_COLOR = vec3(0.35, 0.10, 0.70);
const vec3 EDGE_GLOW_COLOR = vec3(0.90, 0.85, 1.00);

const float PURPLE_CONCENTRATION = 1.0;
const float EDGE_CONCENTRATION = 4.0;

const float NOISE_SCALE = 1.5;
const float NOISE_SPEED = 1.0;
const float FLICKER_STRENGTH = 0.5;

float random(vec2 p) {
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(
        mix(random(ip), random(ip + vec2(1.0, 0.0)), u.x),
        mix(random(ip + vec2(0.0, 1.0)), random(ip + vec2(1.0, 1.0)), u.x),
        u.y);
    return res * res;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    
    float purpleIntensity = pow(1.0 - uv.y, PURPLE_CONCENTRATION);
    float edgeIntensity = pow(1.0 - uv.y, EDGE_CONCENTRATION);
    
    vec2 noiseUV = uv * NOISE_SCALE;
    noiseUV.x += iTime * NOISE_SPEED;
    float shimmer = noise(noiseUV) * FLICKER_STRENGTH;
    vec3 color = vec3(0.0);
    color += PURPLE_GLOW_COLOR * (purpleIntensity + purpleIntensity * shimmer);

    color += EDGE_GLOW_COLOR * edgeIntensity;
    gl_FragColor = vec4(color, 1.0);
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error compiling shader:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram | null {
    const program = gl.createProgram()
    if (!program) return null

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program:", gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
    }

    return program
}

export function ShaderBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl")
        if (!gl) {
            console.error("WebGL not supported")
            return
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

        if (!vertexShader || !fragmentShader) return

        const program = createProgram(gl, vertexShader, fragmentShader)
        if (!program) return

        const positionBuffer = gl.createBuffer()
        if (!positionBuffer) return
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )

        const positionLocation = gl.getAttribLocation(program, "a_position")
        const timeLocation = gl.getUniformLocation(program, "iTime")
        const resolutionLocation = gl.getUniformLocation(program, "iResolution")

        function resizeCanvas() {
            if (!canvas || !gl) return
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            gl.viewport(0, 0, canvas.width, canvas.height)
        }

        function render(time: number) {
            if (!canvas || !gl) return

            gl.useProgram(program)

            gl.enableVertexAttribArray(positionLocation)
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

            gl.uniform1f(timeLocation, time * 0.001)
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            animationRef.current = requestAnimationFrame(render)
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)
        animationRef.current = requestAnimationFrame(render)

        return () => {
            window.removeEventListener("resize", resizeCanvas)
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="-z-10 fixed inset-0 h-full w-full"
            style={{ width: "100%", height: "100%" }}
        />
    )
}
