import React, { Component } from "react";
import { Button, Input, message } from "antd";
import { CloseCircleTwoTone } from "@ant-design/icons";
import CanvasJSReact from "./canvasjs.react";
import "./App.css";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// 单个折线图显示的数据个数
const DATA_COUNT = 80;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      datas: [],
      inputArr: [
        {
          value: "",
        },
      ],

      inputValue: "",
    };
    this.ws = null;
    this.connected = false;
  }

  componentWillUnmount() {
    this.closeConn();
  }

  initWebSocket = () => {
    // 连接websocket之前关闭之前未关闭的websocket
    this.closeConn();

    const { inputArr } = this.state;
    if (inputArr.length === 1) {
      message.info("请输入设备编号！");
      return;
    } else {
      let params = "";
      inputArr.map((item, index) => {
        if (item.value) {
          params += `&w${index}=${item.value}`;
        }
      });
      params = params.substr(1);

      this.setState({ data: [], count: 0 });
      const G = window.ws;
      let baseUrl = G ? G.wsUrl : "ws://tencent.guohuasun.com:9002";
      let url = `${baseUrl}/?${params}`;

      this.ws = new WebSocket(url);
      this.ws.onopen = (evt) => {
        this.connected = true;
        this.ws.send("Hello WebSockets!");
      };

      this.ws.onmessage = (evt) => {
        let { datas } = this.state;
        datas.map((item) => {
          let { data = [], count = 0, key, total = 0 } = item;
          let len = data.length;
          let tmp = JSON.parse(evt.data);
          let value = Number(tmp.weight);
          let rfid = tmp.id;
          if (tmp.topic === key) {
            if (len < DATA_COUNT) {
              data.push({
                y: value,
                x: total++,
              });
            } else {
              data.shift();
              data.push({
                y: value,
                x: total++,
              });
            }
            item.count = count + 1;
            item.total = total + 1;
            item.data = data;
            item.rfid = rfid;
          }

          return item;
        });
        this.setState({ datas });
      };

      this.ws.onclose = this.closeConn();
    }
  };

  closeConn = () => {
    if (this.connected) {
      this.ws.close();
      this.connected = false;
      this.ws = null;
    }
  };

  handleChangeInput = (e) => {
    this.setState({
      inputValue: e.target.value,
    });
  };

  handleAddItem = (e, index) => {
    let value = e.target.value;
    let { inputArr, datas } = this.state;

    inputArr[index].value = value;
    datas[index] = { key: value, data: [], count: 0 };
    inputArr.push({ value: "" });

    this.setState({
      inputArr,
      datas,
      inputValue: "",
    });
  };

  handleCloseItem = (idx) => {
    let { inputArr, datas } = this.state;
    inputArr.splice(idx, 1);
    datas.splice(idx, 1);
    this.setState({
      inputArr,
      datas,
    });
  };

  render() {
    const { datas, inputArr, inputValue } = this.state;
    let options = [];
    datas.forEach((item) => {
      const { count = 0, rfid, key, data = [] } = item;
      options.push({
        title: {
          text: `topic: ${key} | 第${count}个 | 当前RFID: ${rfid}`,
          fontSize: 20,
        },
        // height: 600,
        axisX: {
          title: "TIMESTAMP",
        },
        axisY: {
          title: "DATA",
        },
        data: [
          {
            type: "line",
            dataPoints: data,
          },
        ],
      });
    });

    return (
      <div className="app-container">
        {/* 操作栏 */}
        <div className="tag-input-container">
          <ul className="tag-input-ul">
            {inputArr.map((item, index) => (
              <li className="tag-input-item" key={item + index}>
                <div className="item-wrapper">
                  <span>{item.value}</span>
                  {item.value ? (
                    <Button
                      type="text"
                      icon={<CloseCircleTwoTone />}
                      size="small"
                      onClick={() => this.handleCloseItem(index)}
                    ></Button>
                  ) : null}
                  <Input
                    type={item.value ? "hidden" : ""}
                    value={inputValue}
                    // bordered={false}
                    className="tag-item-input"
                    onChange={this.handleChangeInput}
                    onPressEnter={(e) => this.handleAddItem(e, index)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="btn-wrapper">
          <Button type="primary" onClick={this.initWebSocket}>
            开始
          </Button>
          <Button style={{ marginLeft: 20 }} onClick={this.closeConn}>
            停止
          </Button>
        </div>
        <div className="chart-container">
          {datas.map((item, index) => (
            <div className="chart-wrapper" key={item + index}>
              <CanvasJSChart options={options[index]} key={item.key} />
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default App;
