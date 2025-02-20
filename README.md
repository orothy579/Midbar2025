# MQTT Test Application

This document outlines the MQTT topics used for controlling devices and managing IO.

## Control

pub -> cmd led, fan, pump on/off [control topic]

sub <- sensing data [sensor topic]
sub <- led, fan data [IO topic]

## IO

pub -> sensing data(temp, humid, co2) [sensor topic]
pub -> led, fan data (led, fan)  [IO topic]

sub <- cmd led, fan, pump on/off [control topic]



# 🌬️ **AirFarm 공조 시스템 관리 프로그램**

**프로젝트 시작일:** 2025-02-03  
**프로젝트 상태:** ⏸️ Paused (2025-02-14)  
**설명:**  
AirFarm 공조 시스템을 제어하고 센서 데이터를 수집하는 **Node.js 기반** 프로그램입니다.  
**MQTT 프로토콜**을 활용하여 **센서 데이터 수집, 공조 장비(LED, 팬, 펌프) 제어 및 모니터링**을 수행합니다.

---

## 🔧 **실행 환경**
- **운영체제:** macOS
- **개발 언어:** TypeScript
- **런타임:** Node.js

---

## 🏗 **기술 스택**
| 기술 | 설명 |
|------|------|
| **Node.js** | 백엔드 실행 환경 |
| **TypeScript** | 정적 타입 지원 개발 언어 |
| **MQTT** | IoT 메시지 브로커 및 장치 제어 |

---

## 🚀 **설치 및 실행 방법**

### **1️⃣ 환경 설정**
#### **Node.js & TypeScript 설치**
```sh
brew install node
npm install -g typescript ts-node
